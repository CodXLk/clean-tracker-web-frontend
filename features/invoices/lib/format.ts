export function dayText(d?: string | null) {
  if (!d) return "—";
  const date = new Date(`${d}T00:00:00`);
  return date.toLocaleDateString("en-AU", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
}

export function dateTimeText(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });
}
