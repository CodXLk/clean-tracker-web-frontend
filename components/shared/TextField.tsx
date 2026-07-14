import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, id, className, required, ...props },
  ref,
) {
  const inputId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-on-surface">
        {label}
        {required && <span className="ml-0.5 text-error">*</span>}
      </label>
      <input
        id={inputId}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cn(
          "h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-on-surface outline-none transition-colors placeholder:text-grey-500/60",
          "focus:border-primary focus:ring-2 focus:ring-primary/20",
          error ? "border-error" : "border-grey-300",
          className,
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-grey-500">{hint}</p>}
      {error && (
        <p id={`${inputId}-error`} className="text-xs font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
});
