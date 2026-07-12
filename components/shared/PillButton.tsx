import { cn } from "@/lib/utils/cn";

export type PillButtonVariant = "orange" | "teal" | "success";

const VARIANT_CLASSES: Record<PillButtonVariant, string> = {
  orange:  "bg-status-pending text-white hover:opacity-90 active:opacity-80",
  teal:    "bg-primary text-on-primary hover:opacity-90 active:opacity-80",
  success: "bg-success text-white hover:opacity-90 active:opacity-80",
};

interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PillButtonVariant;
}

export function PillButton({
  variant = "orange",
  children,
  className,
  disabled,
  ...props
}: PillButtonProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        "flex h-14 w-full items-center justify-center rounded-full text-sm font-semibold transition-opacity",
        VARIANT_CLASSES[variant],
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
