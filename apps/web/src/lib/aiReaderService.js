function normalizeBase(base = '') {
  return String(base || '').trim().replace(/\/+$/, '');
}

function getCandidateBases() {
  const configured = normalizeBase(import.meta.env.VITE_PUBLIC_CONTENT_API_URL || '');
  const bases = [];

  if (configured) {
    bases.push(configured);
  }

  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;

    if (/localhost|127\.0\.0\.1/.test(hostname)) {
      bases.push(normalizeBase(origin), 'http://127.0.0.1:3100', '');
    } else {
      bases.push(normalizeBase(origin), 'https://api.openguidehub.org');
    }
  }

  return [...new Set(bases.filter(Boolean))];
}

async function requestAi(path, payload) {
  const bases = getCandidateBases();
  let lastError = 'AI request failed';

  for (const base of bases) {
    const url = `${base}${path}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok && data?.ok) {
        return data;
      }

      lastError = data?.message || `Request failed with status ${response.status}`;
    } catch (error) {
      lastError = error.message;
    }
  }

  throw new Error(lastError);
}

export function explainArticle(payload) {
  return requestAi('/api/ai/explain', payload);
}

export function translateArticle(payload) {
  return requestAi('/api/ai/translate', payload);
}
