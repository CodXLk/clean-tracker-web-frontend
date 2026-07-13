import { cn } from "@/lib/utils/cn";

interface ProgressBarProps {
  percent:       number;
  className?:    string;
  barClassName?: string;
}

export function ProgressBar({ percent, className, barClassName }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-grey-100", className)}
    >
      <div
        className={cn("h-full rounded-full bg-primary transition-all", barClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
