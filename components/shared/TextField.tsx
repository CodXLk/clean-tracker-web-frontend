import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, id, className, required, type, ...props },
  ref,
) {
  const inputId = id ?? props.name;
  const isPassword = type === "password";
  const [visible, setVisible] = useState(false);
  const resolvedType = isPassword ? (visible ? "text" : "password") : type;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-on-surface">
        {label}
        {required && <span className="ml-0.5 text-error">*</span>}
      </label>
      <div className="relative">
        <input
          id={inputId}
          ref={ref}
          type={resolvedType}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            "h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-on-surface outline-none transition-colors placeholder:text-grey-500/60",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            isPassword && "pr-11",
            error ? "border-error" : "border-grey-300",
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-grey-500 transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:text-primary"
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {hint && !error && <p className="text-xs text-grey-500">{hint}</p>}
      {error && (
        <p id={`${inputId}-error`} className="text-xs font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
});

