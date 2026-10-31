import { cn } from "@/lib/utils/cn";

const STYLES: Record<string, string> = {
  IN_REVIEW: "bg-amber-50 text-amber-700",
  IN_PROGRESS: "bg-primary/10 text-ink",
  PARTIALLY_FULFILLED: "bg-amber-50 text-amber-700",
  PENDING_RECEIVED: "bg-amber-50 text-amber-700",
  DELIVERED: "bg-success/10 text-success",
  PARTIALLY_DELIVERED: "bg-amber-50 text-amber-700",
  AWAITING_SUPPLIER_CONFIRMATION: "bg-amber-50 text-amber-700",
  READY_FOR_PURCHASE: "bg-primary/10 text-ink",
  PENDING: "bg-[#ED5F25]/10 text-[#ED5F25]",
  APPROVED: "bg-primary/10 text-ink",
  REJECTED: "bg-error/10 text-error",
  FULFILLED: "bg-success/10 text-success",
  CANCELLED: "bg-grey-100 text-grey-500",
  PENDING_DISPATCH: "bg-[#ED5F25]/10 text-[#ED5F25]",
  DISPATCHED: "bg-primary/10 text-ink",
  PENDING_APPROVAL: "bg-[#7C3AED]/10 text-[#7C3AED]",
  CONFIRMED: "bg-success/10 text-success",
  DRAFT: "bg-grey-100 text-grey-600",
  SENT: "bg-[#ED5F25]/10 text-[#ED5F25]",
  AWAITING_CLIENT: "bg-[#ED5F25]/10 text-[#ED5F25]",
  CLIENT_DISPATCHED: "bg-primary/10 text-ink",
  PARTIALLY_RECEIVED: "bg-primary/10 text-ink",
  RECEIVED: "bg-success/10 text-success",
};

const LABELS: Record<string, string> = {
  IN_REVIEW: "In review", IN_PROGRESS: "In progress", PARTIALLY_FULFILLED: "Partially fulfilled",
  PENDING_RECEIVED: "Pending received", DELIVERED: "Delivered", PARTIALLY_DELIVERED: "Partially delivered",
  AWAITING_SUPPLIER_CONFIRMATION: "Awaiting supplier confirmation", READY_FOR_PURCHASE: "Ready for purchase",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  FULFILLED: "Fulfilled",
  CANCELLED: "Cancelled",
  PENDING_DISPATCH: "Pending dispatch",
  DISPATCHED: "Dispatched",
  PENDING_APPROVAL: "Pending approval",
  CONFIRMED: "Confirmed",
  DRAFT: "Draft",
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
