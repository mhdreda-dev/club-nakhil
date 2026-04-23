function normalizeDate(date: Date) {
  return date instanceof Date ? date : new Date(date);
}

export function formatSessionDate(date: Date, locale = "en-US") {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(normalizeDate(date));
}

export function formatReadableDateTime(date: Date, locale = "en-US") {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(normalizeDate(date));
}

export function roleLabel(role: string) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}
