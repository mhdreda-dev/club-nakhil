import { format } from "date-fns";

export function formatSessionDate(date: Date) {
  return format(date, "EEE, MMM d, yyyy");
}

export function formatReadableDateTime(date: Date) {
  return format(date, "MMM d, yyyy 'at' HH:mm");
}

export function roleLabel(role: string) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}
