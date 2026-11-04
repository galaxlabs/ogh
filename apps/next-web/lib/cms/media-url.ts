/** Resolve public Frappe file paths for both the public site and Content Studio. */
export function cmsMediaUrl(value: string): string {
  if (!value.startsWith("/files/")) return value;
  const base = (process.env.NEXT_PUBLIC_ADMIN_API_URL || "https://pf.digigalaxy.cloud").replace(/\/+$/, "");
  return `${base}${value}`;
}
