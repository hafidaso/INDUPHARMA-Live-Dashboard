const PRODUCTION_STATUS_URL =
  "https://fusion-ai-api.medifus.dev/webhooks/webhook-vug2y2v8zf6cu492khq7g3o0/api/production/status";

function parseMaybeJson(value) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function isPlainObject(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

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
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      return res.status(502).json({
        error: "Upstream returned non-JSON payload.",
        sample: text.slice(0, 300),
      });
    }

    // Some webhook tools serialize nested objects as strings.
    payload.meta = parseMaybeJson(payload.meta);
    payload.equipements = parseMaybeJson(payload.equipements);

    if (!isPlainObject(payload.meta) || !Array.isArray(payload.equipements)) {
      return res.status(502).json({
        error: "Invalid production payload shape.",
        expected: {
          meta: "object",
          equipements: "array",
        },
        received: {
          metaType: typeof payload.meta,
          equipementsType: Array.isArray(payload.equipements)
            ? "array"
            : typeof payload.equipements,
          metaSample:
            typeof payload.meta === "string"
              ? payload.meta.slice(0, 120)
              : payload.meta,
          equipementsSample:
            typeof payload.equipements === "string"
              ? payload.equipements.slice(0, 120)
              : payload.equipements,
        },
      });
    }

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.status(upstream.status).json(payload);
  } catch (error) {
    return res.status(502).json({
      error: "Failed to fetch production status.",
      details: String(error),
    });
  }
}
