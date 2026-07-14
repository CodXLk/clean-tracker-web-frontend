"use client";

import { useId } from "react";
import { cn } from "@/lib/utils/cn";

const PREFIX = "+61";
const MAX_DIGITS = 9;

interface PhoneNumberFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  /** Full stored value, e.g. "" or "+614XXXXXXXX". */
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  id?: string;
  name?: string;
}

function digitsOf(value: string): string {
  const raw = value.startsWith(PREFIX) ? value.slice(PREFIX.length) : value;
  return raw.replace(/\D/g, "").slice(0, MAX_DIGITS);
}

/** Fixed "+61" prefix + numeric-only entry for the remaining Australian mobile digits. */
export function PhoneNumberField({
  label,
  required,
  error,
  value,
  onChange,
  onBlur,
  id,
  name,
}: PhoneNumberFieldProps) {
  const autoId = useId();
  const inputId = id ?? name ?? autoId;
  const digits = digitsOf(value);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nextDigits = e.target.value.replace(/\D/g, "").slice(0, MAX_DIGITS);
    onChange(nextDigits ? `${PREFIX}${nextDigits}` : "");
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-on-surface">
        {label}
        {required && <span className="ml-0.5 text-error">*</span>}
      </label>
      <div
        className={cn(
          "flex h-11 w-full items-center rounded-xl border bg-white pl-3.5 pr-3.5 text-sm text-on-surface transition-colors",
          "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
          error ? "border-error" : "border-grey-300",
        )}
      >
        <span className="mr-1.5 select-none font-medium text-grey-500">{PREFIX}</span>
        <input
          id={inputId}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="tel-national"
          value={digits}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder="412345678"
          maxLength={MAX_DIGITS}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className="h-full flex-1 bg-transparent outline-none placeholder:text-grey-500/60"
        />
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-xs font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}
