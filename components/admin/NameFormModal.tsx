"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { PillButton } from "@/components/shared/PillButton";

interface NameFormModalProps {
  open: boolean;
  title: string;
  description?: string;
  label: string;
  /** Prefilled value when editing; empty when adding. */
  initialValue?: string;
  submitLabel: string;
  isPending?: boolean;
  error?: string;
  onSubmit: (name: string) => void;
  onClose: () => void;
}

/**
 * Minimal single-field name prompt for adding/renaming a floor or area.
 * Mirrors the backend Create/Update Floor/Area validation (2–150 chars).
 */
export function NameFormModal({
  open,
  title,
  description,
  label,
  initialValue = "",
  submitLabel,
  isPending,
  error,
  onSubmit,
  onClose,
}: NameFormModalProps) {
  const [value, setValue] = useState(initialValue);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setValue(initialValue);
      setTouched(false);
    }
  }, [open, initialValue]);

  const trimmed = value.trim();
  const validationError =
    touched && trimmed.length < 2 ? "Name must be at least 2 characters" : undefined;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (trimmed.length < 2) return;
    onSubmit(trimmed);
  }

  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <TextField
          label={label}
          value={value}
          autoFocus
          maxLength={150}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => setTouched(true)}
          error={validationError}
        />

        {error && (
          <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
            {error}
          </p>
        )}

        <div className="mt-1 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-full border border-grey-300 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100"
          >
            Cancel
          </button>
          <PillButton type="submit" variant="teal" className="h-11 flex-1" disabled={isPending}>
            {isPending ? "Saving…" : submitLabel}
          </PillButton>
        </div>
      </form>
    </Modal>
  );
}
