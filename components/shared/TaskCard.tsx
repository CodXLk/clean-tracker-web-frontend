import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface TaskCardProps {
  description: string;
  onClose:     () => void;
  children:    React.ReactNode;
  className?:  string;
}

export function TaskCard({ description, onClose, children, className }: TaskCardProps) {
  return (
    <div
      className={cn(
        "w-full rounded-2xl bg-surface p-4 shadow-sm",
        className,
      )}
    >
      {/* Header */}
      <div className="mb-1 flex items-start justify-between gap-2">
        <span className="text-xs text-grey-500">Description</span>
        <button
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 rounded-full p-0.5 text-danger transition-colors hover:bg-danger/10"
        >
          <X size={18} strokeWidth={2} />
        </button>
      </div>

      {/* Description text */}
      <p className="mb-4 text-sm font-semibold text-on-surface leading-snug">
        {description}
      </p>

      {/* Action buttons — slot for PillButton / SlideButton */}
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}
