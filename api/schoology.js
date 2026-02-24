export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  const { url } = req.query;

  // Basic safety check — only allow Schoology iCal URLs
  if (!url || !url.includes("schoology.com")) {
    return res.status(400).json({ error: "Only Schoology URLs are supported" });
  }

  try {
    const response = await fetch(decodeURIComponent(url), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; OptionApp/1.0)",
      },
    });
    const text = await response.text();
    res.status(200).send(text);
  } catch (error) {
    res.status(500).json({ error: "Failed to proxy request" });
  }
}