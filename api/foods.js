export default async function handler(req, res) {
  try {
    const query = req.query?.query;

    if (!query) {
      return res.status(400).json({
        error: "Missing query"
      });
    }

    const apiKey = process.env.USDA_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "USDA_API_KEY is not configured"
      });
    }

    const usdaUrl =
      "https://api.nal.usda.gov/fdc/v1/foods/search" +
      `?api_key=${encodeURIComponent(apiKey)}` +
      `&query=${encodeURIComponent(query)}` +
      "&pageSize=10";

    const response = await fetch(usdaUrl);

    const data = await response.json();

    return res.status(response.status).json(data);

  } catch (error) {
    console.error("USDA API error:", error);

    return res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
}
