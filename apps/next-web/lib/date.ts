export function formatDate(date: string, locale = "en-US", options?: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  });
}

export function formatFullDate(date: string, locale = "en-US") {
  return new Date(date).toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
