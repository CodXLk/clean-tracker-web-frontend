/** "5m ago" for recent items, then a date with time. */
export function formatAnnouncementDate(iso: string): string {
  const then = new Date(iso);
  const ms = then.getTime();
  if (Number.isNaN(ms)) return "";
  const mins = Math.floor((Date.now() - ms) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return then.toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}
