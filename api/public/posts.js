/* global process */

function normalizeBase(base = '') {
  return String(base || '').trim().replace(/\/+$/, '');
}

async function tryFetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  const text = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    text,
  };
}

export default async function handler(req, res) {
  const slug = req.query?.slug;
  const candidates = [
    process.env.BACKEND_PUBLIC_API_BASE,
    process.env.PUBLIC_API_ORIGIN,
    'https://api.openguidehub.org',
    'https://admin.openguidehub.org',
    'http://72.60.118.195:3100',
  ].map(normalizeBase).filter(Boolean);

  const attempts = [];

  for (const backendBase of candidates) {
    const endpoint = slug
      ? `${backendBase}/api/public/posts/${encodeURIComponent(slug)}`
      : `${backendBase}/api/public/posts`;

    try {
      const result = await tryFetchJson(endpoint);
      attempts.push({ endpoint, status: result.status, ok: result.ok });

      if (result.ok) {
        res.status(result.status);
        res.setHeader('Content-Type', 'application/json');
        return res.send(result.text);
      }
    } catch (error) {
      attempts.push({ endpoint, error: error.message });
    }
  }

  return res.status(502).json({
    ok: false,
    message: 'fetch failed',
    attempts,
  });
}
