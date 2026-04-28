const PRODUCTION_STATUS_URL =
  "https://fusion-ai-api.medifus.dev/webhooks/webhook-vug2y2v8zf6cu492khq7g3o0/api/production/status";

export default async function handler(_req, res) {
  try {
    const upstream = await fetch(PRODUCTION_STATUS_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "indupharma-dashboard-proxy",
      },
    });

    const text = await upstream.text();
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.status(upstream.status).send(text);
  } catch (error) {
    return res.status(502).json({
      error: "Failed to fetch production status.",
      details: String(error),
    });
  }
}
