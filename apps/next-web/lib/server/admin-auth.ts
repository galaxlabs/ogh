import { createHmac, timingSafeEqual } from "crypto";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const AUTH_SECRET = process.env.AUTH_SECRET || "";

export function isAdminConfigured() {
  return Boolean(ADMIN_EMAIL && ADMIN_PASSWORD && AUTH_SECRET);
}

export function validateCredentials(email: string, password: string) {
  if (!isAdminConfigured()) return false;
  if (email !== ADMIN_EMAIL) return false;

  const expectedHash = createHmac("sha256", AUTH_SECRET)
    .update(ADMIN_PASSWORD)
    .digest("hex");
  const providedHash = createHmac("sha256", AUTH_SECRET)
    .update(password)
    .digest("hex");

  const a = Buffer.from(expectedHash, "hex");
  const b = Buffer.from(providedHash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function signToken(email: string) {
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + 1000 * 60 * 60 * 12 })).toString("base64url");
  const sig = createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyToken(token: string): { email: string } | null {
  if (!AUTH_SECRET || !token) return null;
  const [payload, sig] = String(token || "").split(".");
  if (!payload || !sig) return null;

  const expected = createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      email: string;
      exp: number;
    };
    if (!data.exp || data.exp < Date.now()) return null;
    return { email: data.email };
  } catch {
    return null;
  }
}
