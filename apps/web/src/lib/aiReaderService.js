function normalizeBase(base = '') {
  return String(base || '').trim().replace(/\/+$/, '');
}

function getCandidateBases() {
  const candidates = new Set();
  const configured = normalizeBase(import.meta.env.VITE_PUBLIC_CONTENT_API_URL || '');

  if (configured) {
    candidates.add(configured);
  }

  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;

    if (/localhost|127\.0\.0\.1/.test(hostname)) {
      candidates.add('http://127.0.0.1:3100');
    } else {
      candidates.add(origin);
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        const rootDomain = parts.slice(-2).join('.');
        candidates.add(`https://api.${rootDomain}`);
        candidates.add(`https://admin.${rootDomain}`);
      }
    }
  }

  candidates.add('');

  return Array.from(candidates).map(normalizeBase);
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
