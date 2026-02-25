export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { username, password, districtUrl } = req.body;

  if (!username || !password || !districtUrl) {
    return res.status(400).json({ error: "Missing username, password, or districtUrl" });
  }

  // Normalize the district URL
  const base = districtUrl.replace(/\/$/, "").replace(/\/+$/, "");
  const endpoint = `${base}/Service/PXPCommunication.asmx`;

  // StudentVUE SOAP envelope — this is the exact format their API expects
  const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ProcessWebServiceRequest xmlns="http://edupoint.com/webservices/">
      <userID>${escapeXml(username)}</userID>
      <password>${escapeXml(password)}</password>
      <skipLoginLog>1</skipLoginLog>
      <parent>0</parent>
      <webServiceHandleName>PXPWebServices</webServiceHandleName>
      <methodName>Gradebook</methodName>
      <paramStr>&lt;Parms&gt;&lt;ReportPeriod&gt;0&lt;/ReportPeriod&gt;&lt;/Parms&gt;</paramStr>
    </ProcessWebServiceRequest>
  </soap:Body>
</soap:Envelope>`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": "http://edupoint.com/webservices/ProcessWebServiceRequest",
      },
      body: soapBody,
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `StudentVUE server returned ${response.status}. Check your district URL.`,
      });
    }

    const xmlText = await response.text();

    // Check for login failure
    if (xmlText.includes("Invalid user") || xmlText.includes("Login failed") || xmlText.includes("The user name or password")) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    // Extract the inner XML from the SOAP response
    const innerMatch = xmlText.match(/<ProcessWebServiceRequestResult>([\s\S]*?)<\/ProcessWebServiceRequestResult>/);
    if (!innerMatch) {
      return res.status(500).json({ error: "Unexpected response format from StudentVUE." });
    }

    // The inner content is HTML-encoded XML — decode it
    const innerXml = innerMatch[1]
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    // Parse the gradebook XML into structured JSON
    const grades = parseGradebook(innerXml);
    return res.status(200).json({ grades });

  } catch (e) {
    return res.status(500).json({
      error: "Could not reach your school's StudentVUE server. Double-check the district URL.",
    });
  }
}

// ── XML escape helper ────────────────────────────────────────
function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ── Parse StudentVUE Gradebook XML into app-friendly JSON ────
function parseGradebook(xml) {
  const courses = [];

  // Each course is a <Course> element
  const courseMatches = xml.matchAll(/<Course\s([^>]*)>([\s\S]*?)<\/Course>/g);

  for (const [, attrs, body] of courseMatches) {
    const attr = parseAttrs(attrs);

    const title = attr.Title || attr.CourseName || "Unknown Course";
    const period = attr.Period || "";
    const room = attr.Room || "";
    const teacher = attr.Staff || "";

    // Grade summary from <Mark> element
    const markMatch = body.match(/<Mark\s([^>]*)\/?>/);
    const mark = markMatch ? parseAttrs(markMatch[1]) : {};

    const letterGrade = mark.CalculatedScoreString || mark.MarkName || "N/A";
    const rawPct = parseFloat(mark.CalculatedScoreRaw || "0");
    const pct = isNaN(rawPct) ? 0 : rawPct;

    // Determine course level from title
    const titleLower = title.toLowerCase();
    const type = titleLower.includes("ap ") || titleLower.startsWith("ap ")
      ? "AP"
      : titleLower.includes("honor") || titleLower.includes("hnr") || titleLower.includes("h ")
      ? "HN"
      : "REG";

    // Compute GP values
    const baseGP = pct >= 93 ? 4.0 : pct >= 90 ? 3.7 : pct >= 87 ? 3.3 : pct >= 83 ? 3.0
      : pct >= 80 ? 2.7 : pct >= 77 ? 2.3 : pct >= 73 ? 2.0 : pct >= 70 ? 1.7 : 1.0;
    const bonus = type === "AP" ? 1.0 : type === "HN" ? 0.5 : 0;
    const wGP = +(baseGP + bonus).toFixed(1);
    const uGP = +baseGP.toFixed(1);

    // Parse individual assignments from <Assignment> elements
    const assignments = [];
    const asgnMatches = body.matchAll(/<Assignment\s([^>]*)\/>/g);

    for (const [, asgnAttrs] of asgnMatches) {
      const a = parseAttrs(asgnAttrs);

      const name = a.Measure || a.MeasureName || "Assignment";
      const dateRaw = a.Date || a.DueDate || "";
      const date = formatDate(dateRaw);

      // Score parsing — StudentVUE uses "points/total" or "score" format
      let score = null;
      let total = null;
      const scoreStr = a.Score || a.Points || "";
      const pointsPossible = a.PointsPossible || a.ScorePossible || "";

      if (scoreStr && pointsPossible && !scoreStr.includes("*") && !scoreStr.toLowerCase().includes("not")) {
        score = parseFloat(scoreStr);
        total = parseFloat(pointsPossible);
      }

      // Map StudentVUE category to our types
      const cat = (a.Type || a.Category || "").toLowerCase();
      let aType = "Formative";
      if (/test|exam|assessment|summative/.test(cat)) aType = "Summative";
      if (/final|midterm|semester/.test(cat)) aType = "Final";

      assignments.push({
        name,
        date,
        type: aType,
        score: score !== null ? score : undefined,
        total: total !== null ? total : undefined,
        category: a.Type || a.Category || "",
        notes: a.Notes || "",
      });
    }

    // Generate a clean course code from period + subject initial
    const code = `PD${period}-${title.slice(0, 3).toUpperCase()}`;

    courses.push({
      id: courses.length + 1,
      code,
      name: title,
      type,
      pct: +pct.toFixed(1),
      letter: letterGrade,
      wGP,
      uGP,
      period,
      room,
      teacher,
      assignments,
    });
  }

  // Sort by period
  return courses.sort((a, b) => {
    const pa = parseInt(a.period) || 99;
    const pb = parseInt(b.period) || 99;
    return pa - pb;
  });
}

// ── Parse XML attribute string into object ───────────────────
function parseAttrs(attrStr) {
  const obj = {};
  const matches = attrStr.matchAll(/(\w+)="([^"]*)"/g);
  for (const [, key, val] of matches) {
    obj[key] = val
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }
  return obj;
}

// ── Format StudentVUE date (M/D/YYYY) to "Mon DD" ───────────
function formatDate(raw) {
  if (!raw) return "";
  try {
    const d = new Date(raw);
    if (isNaN(d)) return raw;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return raw;
  }
}
