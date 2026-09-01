import { cn } from "@/lib/utils/cn";

const STYLES: Record<string, string> = {
  PENDING: "bg-[#ED5F25]/10 text-[#ED5F25]",
  APPROVED: "bg-primary/10 text-ink",
  REJECTED: "bg-error/10 text-error",
  FULFILLED: "bg-success/10 text-success",
  CANCELLED: "bg-grey-100 text-grey-500",
  DISPATCHED: "bg-primary/10 text-ink",
  CONFIRMED: "bg-success/10 text-success",
  SENT: "bg-[#ED5F25]/10 text-[#ED5F25]",
  AWAITING_CLIENT: "bg-[#ED5F25]/10 text-[#ED5F25]",
  CLIENT_DISPATCHED: "bg-primary/10 text-ink",
  PARTIALLY_RECEIVED: "bg-primary/10 text-ink",
  RECEIVED: "bg-success/10 text-success",
};

const LABELS: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  FULFILLED: "Fulfilled",
  CANCELLED: "Cancelled",
  DISPATCHED: "Dispatched",
  CONFIRMED: "Confirmed",
  SENT: "Sent",
  AWAITING_CLIENT: "Awaiting client",
  CLIENT_DISPATCHED: "Client dispatched",
  PARTIALLY_RECEIVED: "Partially received",
  RECEIVED: "Received",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", STYLES[status] ?? "bg-grey-100 text-grey-600")}>
      {LABELS[status] ?? status}
    </span>
  );
}
