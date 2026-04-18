/* global process */

export default async function handler(req, res) {
  const backendBase = process.env.BACKEND_PUBLIC_API_BASE || 'http://72.60.118.195:3100';
  const slug = req.query?.slug;
  const endpoint = slug
    ? `${backendBase}/api/public/posts/${encodeURIComponent(slug)}`
    : `${backendBase}/api/public/posts`;

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
    });

    const text = await response.text();
    res.status(response.status);
    res.setHeader('Content-Type', 'application/json');
    res.send(text);
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
}
