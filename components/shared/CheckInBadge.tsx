import { cn } from "@/lib/utils/cn";

interface CheckInBadgeProps {
  checkedIn:     boolean;
  checkInTime?:  string;
  className?:    string;
}

export function CheckInBadge({ checkedIn, checkInTime, className }: CheckInBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 text-sm text-white",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "h-3 w-3 shrink-0 rounded-full",
          checkedIn ? "bg-success" : "bg-[#ED5F25]",
        )}
      />
      {checkedIn && checkInTime ? `Checked | ${checkInTime}` : "Not check-in"}
    </span>
  );
}
