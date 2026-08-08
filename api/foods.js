export default async function handler(request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("query");

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Missing query" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const apiKey = process.env.USDA_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "USDA_API_KEY is not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const usdaUrl =
      "https://api.nal.usda.gov/fdc/v1/foods/search" +
      `?api_key=${encodeURIComponent(apiKey)}` +
      `&query=${encodeURIComponent(query)}` +
      "&pageSize=10";

    const response = await fetch(usdaUrl);

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        "Content-Type": "application/json"
      }
    });

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Server error",
        details: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
