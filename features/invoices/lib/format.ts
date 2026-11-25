import { formatDate, formatDateTime } from "@/lib/utils/format";

export function dayText(d?: string | null) {
  if (!d) return "—";
  return `${formatDate(d, { weekday: "short" })} ${formatDate(d)}`;
}

export function dateTimeText(d?: string | null) {
  if (!d) return "—";
  return formatDateTime(d);
}
