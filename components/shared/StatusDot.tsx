import { cn } from "@/lib/utils/cn";

export type StatusDotVariant = "active" | "pending" | "inactive" | "error";

const VARIANT_CLASSES: Record<StatusDotVariant, string> = {
  active:   "bg-status-active",
  pending:  "bg-status-pending",
  inactive: "bg-status-inactive",
  error:    "bg-error",
};

const SIZE_CLASSES = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4",
} as const;

const LABEL_MAP: Record<StatusDotVariant, string> = {
  active:   "Active",
  pending:  "Pending",
  inactive: "Inactive",
  error:    "Error",
};

interface StatusDotProps {
  variant:    StatusDotVariant;
  size?:      keyof typeof SIZE_CLASSES;
  className?: string;
  showLabel?: boolean;
  label?:     string;
}

export function StatusDot({
  variant,
  size = "md",
  className,
  showLabel = false,
  label,
}: StatusDotProps) {
  const displayLabel = label ?? LABEL_MAP[variant];

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "inline-block shrink-0 rounded-full",
          SIZE_CLASSES[size],
          VARIANT_CLASSES[variant],
        )}
      />
      {showLabel && (
        <span className="text-sm text-on-surface">{displayLabel}</span>
      )}
      <span className="sr-only">{displayLabel}</span>
    </span>
  );
}
