export default async function handler(req, res) {
  // Allow browser requests from any origin
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "No URL provided" });
  }

  // Basic safety check — only allow Schoology iCal URLs
  if (!url.includes("schoology.com") && !url.includes(".ics")) {
    return res.status(400).json({ error: "Only Schoology iCal URLs are supported" });
  }

  try {
    const response = await fetch(decodeURIComponent(url), {
      headers: {
        // Mimic a real browser request
        "User-Agent": "Mozilla/5.0 (compatible; OptionApp/1.0)",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Schoology returned ${response.status}. Check your iCal URL is correct and not expired.`,
      });
    }

    const text = await response.text();

    // Make sure it looks like an iCal file
    if (!text.includes("BEGIN:VCALENDAR")) {
      return res.status(400).json({
        error: "URL did not return a valid calendar file. Make sure you copied the full iCal URL from Schoology.",
      });
    }

    res.status(200).send(text);
  } catch (e) {
    res.status(500).json({
      error: "Could not reach Schoology. Check your internet connection and try again.",
    });
  }
}