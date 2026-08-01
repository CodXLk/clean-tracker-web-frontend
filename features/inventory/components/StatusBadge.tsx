import { cn } from "@/lib/utils/cn";

const STYLES: Record<string, string> = {
  PENDING: "bg-[#ED5F25]/10 text-[#ED5F25]",
  APPROVED: "bg-primary/10 text-primary",
  REJECTED: "bg-error/10 text-error",
  FULFILLED: "bg-success/10 text-success",
  CANCELLED: "bg-grey-100 text-grey-500",
  DISPATCHED: "bg-primary/10 text-primary",
  CONFIRMED: "bg-success/10 text-success",
};

const LABELS: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  FULFILLED: "Fulfilled",
  CANCELLED: "Cancelled",
  DISPATCHED: "Dispatched",
  CONFIRMED: "Confirmed",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", STYLES[status] ?? "bg-grey-100 text-grey-600")}>
      {LABELS[status] ?? status}
    </span>
  );
}
