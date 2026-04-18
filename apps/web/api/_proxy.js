/* global process */

function normalizeBase(base = '') {
  return String(base || '').trim().replace(/\/+$/, '');
}

export function getBackendCandidates() {
  return [
    process.env.BACKEND_PUBLIC_API_BASE,
    process.env.PUBLIC_API_ORIGIN,
    'https://api.openguidehub.org',
    'https://admin.openguidehub.org',
    'http://api.openguidehub.org',
    'http://admin.openguidehub.org',
    'http://72.60.118.195:3100',
  ].map(normalizeBase).filter(Boolean);
}

export async function proxyRequest(req, res, targetPath) {
  const candidates = getBackendCandidates();
  const attempts = [];
  const method = req.method || 'GET';
  const hasBody = !['GET', 'HEAD'].includes(method.toUpperCase());

  for (const base of candidates) {
    const endpoint = `${base}${targetPath}`;

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: req.headers.authorization || '',
        },
        body: hasBody ? JSON.stringify(req.body || {}) : undefined,
      });

      const text = await response.text();
      attempts.push({ endpoint, status: response.status, ok: response.ok });

      if (response.ok || [400, 401, 403, 404, 429, 503].includes(response.status)) {
        res.status(response.status);
        res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
        return res.send(text);
      }
    } catch (error) {
      attempts.push({ endpoint, error: error.message });
    }
  }

  return res.status(502).json({ ok: false, message: 'fetch failed', attempts });
}
