export function formatDate(date: string, locale = "en-US", options?: Intl.DateTimeFormatOptions) {
  return parseDate(date).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
    timeZone: "UTC",
  });
}

export function formatFullDate(date: string, locale = "en-US") {
  return parseDate(date).toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function parseDate(value: string): Date {
  // Frappe datetimes may omit an offset. Interpret them consistently in SSR
  // and browser runtimes instead of relying on each machine's local timezone.
  const normalized = value.replace(" ", "T");
  const withZone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(normalized)
    && !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized)
    ? `${normalized}Z`
    : normalized;
  return new Date(withZone);
}
