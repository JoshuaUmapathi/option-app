export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch {
      return res.status(400).json({ error: "Invalid JSON body" });
    }
  }
  if (!body) return res.status(400).json({ error: "Empty request body" });

  const { username, password, districtUrl } = body;
  if (!username || !password || !districtUrl) {
    return res.status(400).json({ error: "Missing username, password, or districtUrl" });
  }

  const base = districtUrl.trim().replace(/\/+$/, "");

  // ── Try multiple endpoint paths — different districts use different structures ──
  // Most districts: /Service/PXPCommunication.asmx
  // FCPS and some others: /SVUE/Service/PXPCommunication.asmx
  const candidateEndpoints = [
    `${base}/Service/PXPCommunication.asmx`,
    `${base}/SVUE/Service/PXPCommunication.asmx`,
    `${base}/PXP2/Service/PXPCommunication.asmx`,
  ];

  const soapFor = (u, p) => [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
    '  xmlns:xsd="http://www.w3.org/2001/XMLSchema"',
    '  xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">',
    '  <soap:Body>',
    '    <ProcessWebServiceRequest xmlns="http://edupoint.com/webservices/">',
    `      <userID>${escapeXml(u)}</userID>`,
    `      <password>${escapeXml(p)}</password>`,
    '      <skipLoginLog>1</skipLoginLog>',
    '      <parent>0</parent>',
    '      <webServiceHandleName>PXPWebServices</webServiceHandleName>',
    '      <methodName>Gradebook</methodName>',
    '      <paramStr>&lt;Parms&gt;&lt;ReportPeriod&gt;0&lt;/ReportPeriod&gt;&lt;/Parms&gt;</paramStr>',
    '    </ProcessWebServiceRequest>',
    '  </soap:Body>',
    '</soap:Envelope>',
  ].join("\n");

  // Try each endpoint until one returns valid XML
  let xmlText = "";
  let successEndpoint = "";
  let lastError = "";

  for (const endpoint of candidateEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          "SOAPAction": "http://edupoint.com/webservices/ProcessWebServiceRequest",
          "User-Agent": "Mozilla/5.0",
        },
        body: soapFor(username, password),
        signal: AbortSignal.timeout(12000),
      });

      const text = await response.text();

      // Skip HTML responses (wrong path, login redirect, etc.)
      const trimmed = text.trimStart();
      if (trimmed.startsWith("<html") || trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<!doctype")) {
        lastError = `Endpoint ${endpoint} returned an HTML page (wrong path).`;
        continue;
      }

      // Skip non-200 that aren't XML
      if (!response.ok && !text.includes("ProcessWebServiceRequestResult")) {
        lastError = `Endpoint ${endpoint} returned HTTP ${response.status}.`;
        continue;
      }

      // If we got SOAP XML back, this is the right endpoint
      if (text.includes("ProcessWebServiceRequestResult") || text.includes("<soap:")) {
        xmlText = text;
        successEndpoint = endpoint;
        break;
      }

      lastError = `Endpoint ${endpoint} returned unexpected content.`;
    } catch (e) {
      const isTimeout = e?.name === "TimeoutError" || e?.name === "AbortError";
      lastError = isTimeout
        ? `Endpoint ${endpoint} timed out.`
        : `Endpoint ${endpoint} unreachable: ${e?.message}`;
      // Don't break — try next endpoint
    }
  }

  if (!xmlText) {
    return res.status(502).json({
      error: `Could not reach StudentVUE at "${base}". None of the standard endpoint paths worked. Make sure your district URL is correct and starts with https://.`,
      detail: lastError,
    });
  }

  // ── Check for auth failure ────────────────────────────────────
  const failPhrases = [
    "Invalid user", "Login failed", "The user name or password",
    "credentials are incorrect", "not authorized", "Invalid credentials",
  ];
  if (failPhrases.some(p => xmlText.includes(p))) {
    return res.status(401).json({ error: "Invalid username or password. Check your StudentVUE credentials." });
  }

  // ── Extract inner XML from SOAP envelope ─────────────────────
  const innerMatch = xmlText.match(/<ProcessWebServiceRequestResult>([\s\S]*?)<\/ProcessWebServiceRequestResult>/);
  if (!innerMatch) {
    return res.status(500).json({
      error: "Got a SOAP response but couldn't find grade data inside it. Your account may not have gradebook access.",
      endpoint_used: successEndpoint,
      raw_preview: xmlText.slice(0, 300),
    });
  }

  const innerXml = innerMatch[1]
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

  try {
    const grades = parseGradebook(innerXml);
    return res.status(200).json({ grades, endpoint_used: successEndpoint });
  } catch (e) {
    return res.status(500).json({
      error: "Connected to StudentVUE but failed to parse the gradebook data.",
      detail: e?.message,
    });
  }
}

// ── Helpers ───────────────────────────────────────────────────

function escapeXml(str) {
  return String(str)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&apos;");
}

function parseAttrs(attrStr) {
  const obj = {};
  for (const [, key, val] of attrStr.matchAll(/(\w+)="([^"]*)"/g)) {
    obj[key] = val
      .replace(/&amp;/g,"&").replace(/&lt;/g,"<")
      .replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'");
  }
  return obj;
}

function formatDate(raw) {
  if (!raw) return "";
  try {
    const d = new Date(raw);
    return isNaN(d) ? raw : d.toLocaleDateString("en-US", { month:"short", day:"numeric" });
  } catch { return raw; }
}

function parseGradebook(xml) {
  const courses = [];

  for (const [, attrs, body] of xml.matchAll(/<Course\s([^>]*)>([\s\S]*?)<\/Course>/g)) {
    const attr    = parseAttrs(attrs);
    const title   = attr.Title || attr.CourseName || "Unknown Course";
    const period  = attr.Period || "";
    const room    = attr.Room  || "";
    const teacher = attr.Staff || attr.Teacher || "";

    const markMatch = body.match(/<Mark\s([^>]*)\/?>/);
    const mark = markMatch ? parseAttrs(markMatch[1]) : {};
    const letterGrade = mark.CalculatedScoreString || mark.MarkName || "N/A";
    const rawPct = parseFloat(mark.CalculatedScoreRaw || mark.CalculatedScore || "0");
    const pct = isNaN(rawPct) ? 0 : rawPct;

    const tl   = title.toLowerCase();
    const type = /\bap\b/.test(tl) ? "AP" : /honor|hnr|adv|accelerat/.test(tl) ? "HN" : "REG";
    const baseGP = pct>=93?4:pct>=90?3.7:pct>=87?3.3:pct>=83?3:pct>=80?2.7:pct>=77?2.3:pct>=73?2:pct>=70?1.7:1;
    const bonus  = type==="AP"?1:type==="HN"?0.5:0;

    const assignments = [];
    for (const [, asgnAttrs] of body.matchAll(/<Assignment\s([^>]*)\/>/g)) {
      const a        = parseAttrs(asgnAttrs);
      const scoreStr = a.Score || a.Points || "";
      const possStr  = a.PointsPossible || a.ScorePossible || "";
      const hasScore = scoreStr && possStr
        && !scoreStr.includes("*")
        && !/not|graded|missing/i.test(scoreStr);
      const cat = (a.Type || a.Category || "").toLowerCase();

      assignments.push({
        name:     a.Measure || a.MeasureName || "Assignment",
        date:     formatDate(a.Date || a.DueDate || ""),
        type:     /final|midterm|semester/.test(cat) ? "Final"
                : /test|exam|assess|summ/.test(cat)  ? "Summative"
                : "Formative",
        score:    hasScore ? parseFloat(scoreStr) : undefined,
        total:    hasScore ? parseFloat(possStr)  : undefined,
        category: a.Type || a.Category || "",
      });
    }

    courses.push({
      id:     courses.length + 1,
      code:   `PD${period}-${title.slice(0,3).toUpperCase()}`,
      name:   title,
      type,
      pct:    +pct.toFixed(1),
      letter: letterGrade,
      wGP:    +(baseGP + bonus).toFixed(1),
      uGP:    +baseGP.toFixed(1),
      period, room, teacher, assignments,
    });
  }

  return courses.sort((a,b) => (parseInt(a.period)||99) - (parseInt(b.period)||99));
}