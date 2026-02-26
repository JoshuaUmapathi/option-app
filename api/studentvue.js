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

  // ── Discover the working endpoint ────────────────────────────
  const candidateEndpoints = [
    `${base}/Service/PXPCommunication.asmx`,
    `${base}/SVUE/Service/PXPCommunication.asmx`,
    `${base}/PXP2/Service/PXPCommunication.asmx`,
  ];

  // Build a SOAP request for any method + paramStr
  const buildSoap = (u, p, method, paramStr) => `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ProcessWebServiceRequest xmlns="http://edupoint.com/webservices/">
      <userID>${escapeXml(u)}</userID>
      <password>${escapeXml(p)}</password>
      <skipLoginLog>1</skipLoginLog>
      <parent>0</parent>
      <webServiceHandleName>PXPWebServices</webServiceHandleName>
      <methodName>${method}</methodName>
      <paramStr>${paramStr}</paramStr>
    </ProcessWebServiceRequest>
  </soap:Body>
</soap:Envelope>`;

  // Generic fetch to the SOAP endpoint
  const soapFetch = async (endpoint, soapBody) => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": "http://edupoint.com/webservices/ProcessWebServiceRequest",
        "User-Agent": "Mozilla/5.0",
      },
      body: soapBody,
      signal: AbortSignal.timeout(15000),
    });
    return response.text();
  };

  // Extract + decode the inner XML result from a SOAP response
  const extractInner = (xmlText) => {
    const match = xmlText.match(/<ProcessWebServiceRequestResult>([\s\S]*?)<\/ProcessWebServiceRequestResult>/);
    if (!match) return null;
    return match[1]
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  };

  // ── Step 1: Find the working endpoint with a test request ────
  let endpoint = "";
  let lastError = "";

  for (const candidate of candidateEndpoints) {
    try {
      const text = await soapFetch(
        candidate,
        buildSoap(username, password, "Gradebook", "&lt;Parms&gt;&lt;ReportPeriod&gt;0&lt;/ReportPeriod&gt;&lt;/Parms&gt;")
      );
      const trimmed = text.trimStart();
      if (trimmed.startsWith("<html") || trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<!doctype")) {
        lastError = `${candidate} returned HTML (wrong path).`;
        continue;
      }
      if (text.includes("ProcessWebServiceRequestResult") || text.includes("<soap:Body>")) {
        endpoint = candidate;
        break;
      }
      lastError = `${candidate} returned unexpected content.`;
    } catch (e) {
      lastError = `${candidate}: ${e?.message}`;
    }
  }

  if (!endpoint) {
    return res.status(502).json({
      error: `Could not reach StudentVUE at "${base}". Check your district URL starts with https://.`,
      detail: lastError,
    });
  }

  // ── Step 2: Fetch the Gradebook listing to find all report periods ──
  // This gives us the <ReportingPeriod> list with indexes and date ranges
  let gradebookListXml = "";
  try {
    const raw = await soapFetch(
      endpoint,
      buildSoap(username, password, "Gradebook", "&lt;Parms&gt;&lt;ReportPeriod&gt;0&lt;/ReportPeriod&gt;&lt;/Parms&gt;")
    );
    gradebookListXml = extractInner(raw) || "";
  } catch (e) {
    return res.status(502).json({ error: "Failed fetching gradebook periods.", detail: e?.message });
  }

  const failPhrases = ["Invalid user", "Login failed", "The user name or password", "credentials are incorrect", "not authorized"];
  if (failPhrases.some(p => gradebookListXml.includes(p) || gradebookListXml === "")) {
    if (failPhrases.some(p => gradebookListXml.includes(p))) {
      return res.status(401).json({ error: "Invalid username or password." });
    }
  }

  // ── Step 3: Find the most recent (current) reporting period index ──
  // StudentVUE returns <ReportingPeriods> with multiple <ReportPeriod> elements
  // Each has a GradePeriod name like "Quarter 1", "Quarter 2", and an Index attribute
  // We also look at StartDate/EndDate to find the most recent past-or-current one
  const today = new Date();
  let bestIndex = 0;
  let bestDate  = new Date(0);
  let foundCurrent = false;

  // Try to find the current period by date
  const periodMatches = [...gradebookListXml.matchAll(/<ReportPeriod\s([^/]*?)\/?>/g)];
  
  if (periodMatches.length > 0) {
    for (const [, attrs] of periodMatches) {
      const a = parseAttrs(attrs);
      const idx = parseInt(a.Index ?? a.GradingPeriodIndex ?? "0");
      const startRaw = a.StartDate || a.Start || "";
      const endRaw   = a.EndDate   || a.End   || "";
      const start = startRaw ? new Date(startRaw) : null;
      const end   = endRaw   ? new Date(endRaw)   : null;

      // If today falls within this period, it's definitely current
      if (start && end && today >= start && today <= end) {
        bestIndex = idx;
        foundCurrent = true;
        break;
      }

      // Otherwise track the period with the most recent start date that's still in the past
      if (start && start <= today && start > bestDate) {
        bestDate  = start;
        bestIndex = idx;
      }
    }

    // If no period matched by date, fall back to the highest index (latest period)
    if (!foundCurrent && periodMatches.length > 0) {
      let maxIdx = 0;
      for (const [, attrs] of periodMatches) {
        const a = parseAttrs(attrs);
        const idx = parseInt(a.Index ?? a.GradingPeriodIndex ?? "0");
        if (idx > maxIdx) maxIdx = idx;
      }
      // Only override if we didn't already find a better match by date
      if (bestDate.getTime() === 0) bestIndex = maxIdx;
    }
  }

  // ── Step 4: Fetch the gradebook for the identified current period ──
  let currentGradebookXml = gradebookListXml; // Already have period 0 if that's current

  if (bestIndex !== 0) {
    try {
      const paramStr = `&lt;Parms&gt;&lt;ReportPeriod&gt;${bestIndex}&lt;/ReportPeriod&gt;&lt;/Parms&gt;`;
      const raw = await soapFetch(endpoint, buildSoap(username, password, "Gradebook", paramStr));
      const inner = extractInner(raw);
      if (inner) currentGradebookXml = inner;
    } catch (e) {
      // Fall back to whatever we already have
    }
  }

  // ── Step 5: Parse and return ──────────────────────────────────
  try {
    const grades = parseGradebook(currentGradebookXml);
    // Attach period info for debugging
    const periodName = (() => {
      for (const [, attrs] of periodMatches) {
        const a = parseAttrs(attrs);
        const idx = parseInt(a.Index ?? a.GradingPeriodIndex ?? "0");
        if (idx === bestIndex) return a.GradePeriod || a.MarkingPeriod || `Period ${bestIndex}`;
      }
      return `Period ${bestIndex}`;
    })();
    return res.status(200).json({ grades, period: periodName, endpoint_used: endpoint });
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
    const room    = attr.Room   || "";
    const teacher = attr.Staff  || attr.Teacher || "";

    // ── Get overall grade from <Mark> ───────────────────────────
    const markMatch = body.match(/<Mark\s([^>]*)\/?>/);
    const mark = markMatch ? parseAttrs(markMatch[1]) : {};
    const letterGrade = mark.CalculatedScoreString || mark.MarkName || "N/A";
    const rawPct = parseFloat(mark.CalculatedScoreRaw || mark.CalculatedScore || "0");
    const pct = isNaN(rawPct) ? 0 : rawPct;

    // ── Course level ────────────────────────────────────────────
    const tl   = title.toLowerCase();
    const type = /\bap\b/.test(tl) ? "AP" : /honor|hnr|adv|accelerat/.test(tl) ? "HN" : "REG";
    const baseGP = pct>=93?4:pct>=90?3.7:pct>=87?3.3:pct>=83?3:pct>=80?2.7:pct>=77?2.3:pct>=73?2:pct>=70?1.7:1;
    const bonus  = type==="AP"?1:type==="HN"?0.5:0;

    // ── Parse all assignments ────────────────────────────────────
    // StudentVUE nests assignments inside <Assignments> -> <Assignment>
    // Each assignment has: Measure, Date, DueDate, Score, ScoreType, Points, Notes, Type, etc.
    const assignments = [];

    for (const [, asgnAttrs] of body.matchAll(/<Assignment\s([^>]*)\/>/g)) {
      const a = parseAttrs(asgnAttrs);

      const name     = a.Measure || a.MeasureName || "Assignment";
      const dateRaw  = a.Date    || a.DueDate     || "";
      const date     = formatDate(dateRaw);
      const isoDate  = dateRaw ? (() => { try { return new Date(dateRaw).toISOString().slice(0,10); } catch { return ""; } })() : "";

      // Score can come as "XX / YY" combined, or separate Score + PointsPossible
      let scoreNum = undefined;
      let totalNum = undefined;

      const rawScore = a.Score || a.Points || "";
      const rawPoss  = a.PointsPossible || a.ScorePossible || "";

      // Handle "XX / YY" combined format some districts use
      if (rawScore.includes("/")) {
        const parts = rawScore.split("/").map(s => s.trim());
        const s = parseFloat(parts[0]);
        const t = parseFloat(parts[1]);
        if (!isNaN(s) && !isNaN(t)) { scoreNum = s; totalNum = t; }
      } else if (rawScore && rawPoss) {
        const s = parseFloat(rawScore);
        const t = parseFloat(rawPoss);
        // Exclude ungraded/missing markers
        const isGraded = !rawScore.includes("*")
          && !/not|graded|missing|incomplete|ng/i.test(rawScore)
          && !isNaN(s) && !isNaN(t);
        if (isGraded) { scoreNum = s; totalNum = t; }
      }

      // Category → our type mapping
      const cat = (a.Type || a.Category || a.MeasureType || "").toLowerCase();
      const aType =
        /final|midterm|semester|exam/.test(cat) ? "Final" :
        /test|quiz|assess|summ|major/.test(cat)  ? "Summative" :
        "Formative";

      // Only include assignments that have a name (skip blank rows)
      if (name && name !== "Assignment") {
        assignments.push({
          name,
          date,
          isoDate,
          type:     aType,
          score:    scoreNum,
          total:    totalNum,
          category: a.Type || a.Category || a.MeasureType || "",
          notes:    a.Notes || "",
          // Include raw score string for display if points aren't parsed
          rawScore: rawScore || "",
          scoreType: a.ScoreType || "",
        });
      }
    }

    // Sort assignments newest first
    assignments.sort((a, b) => {
      if (a.isoDate && b.isoDate) return b.isoDate.localeCompare(a.isoDate);
      return 0;
    });

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

  return courses.sort((a, b) => (parseInt(a.period)||99) - (parseInt(b.period)||99));
}