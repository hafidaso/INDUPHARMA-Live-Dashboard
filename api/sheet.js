export default async function handler(req, res) {
  const sourceUrl = req.query?.url;

  if (!sourceUrl || typeof sourceUrl !== 'string') {
    return res.status(400).json({ error: 'Missing "url" query parameter.' });
  }

  let parsed;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid URL.' });
  }

  // Allow only Google Sheets public CSV endpoints.
  const isGoogleSheets =
    parsed.hostname === 'docs.google.com' &&
    parsed.pathname.includes('/spreadsheets/');
  if (!isGoogleSheets) {
    return res.status(403).json({ error: 'URL not allowed.' });
  }

  try {
    const upstream = await fetch(sourceUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'indupharma-dashboard-proxy',
        Accept: 'text/csv,text/plain,*/*',
      },
    });

    const body = await upstream.text();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.status(upstream.status).send(body);
  } catch (error) {
    return res.status(502).json({
      error: 'Failed to fetch upstream sheet.',
      details: String(error),
    });
  }
}
