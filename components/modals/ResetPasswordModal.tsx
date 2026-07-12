"use client";

import { useState } from "react";
import { Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PillButton } from "@/components/shared/PillButton";

interface ResetPasswordModalProps {
  open:    boolean;
  onClose: () => void;
}

interface PasswordField {
  id:          string;
  label:       string;
  placeholder: string;
}

const PASSWORD_FIELDS: PasswordField[] = [
  { id: "current",  label: "Current password",  placeholder: "Enter current password"  },
  { id: "new",      label: "New password",       placeholder: "Enter new password"       },
  { id: "confirm",  label: "Confirm password",   placeholder: "Confirm new password"    },
];

export function ResetPasswordModal({ open, onClose }: ResetPasswordModalProps) {
  const [values,  setValues]  = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);

  if (!open) return null;

  function handleSave() {
    onClose();
    setValues({});
    setEditing(null);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Reset password"
        className={cn(
          "fixed z-50 bg-white p-6",
          "inset-x-0 bottom-0 rounded-t-3xl",
          "lg:inset-0 lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-md lg:rounded-3xl lg:shadow-2xl",
        )}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-on-surface">Reset password</h2>
          <button
            onClick={onClose}
            aria-label="Close reset password"
            className="rounded-full p-0.5 text-danger transition-colors hover:bg-danger/10"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Password fields */}
        <div className="mb-6 flex flex-col">
          {PASSWORD_FIELDS.map((field, idx) => (
            <div
              key={field.id}
              className={cn(
                "flex items-center justify-between gap-2 py-3",
                idx < PASSWORD_FIELDS.length - 1 && "border-b border-grey-300",
              )}
            >
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="text-xs text-grey-500">{field.label}</span>
                {editing === field.id ? (
                  <input
                    type="password"
                    value={values[field.id] ?? ""}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                    }
                    onBlur={() => setEditing(null)}
                    autoFocus
                    placeholder={field.placeholder}
                    className="text-sm font-medium text-on-surface outline-none bg-transparent placeholder:text-grey-500"
                  />
                ) : (
                  <span className="text-sm font-medium text-on-surface">
                    {values[field.id] ? "••••••••" : (
                      <span className="text-grey-500">{field.placeholder}</span>
                    )}
                  </span>
                )}
              </div>
              <button
                onClick={() => setEditing(field.id)}
                aria-label={`Edit ${field.label}`}
                className="shrink-0 rounded-full p-1 text-grey-500 transition-colors hover:bg-grey-100 hover:text-primary"
              >
                <Pencil size={14} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>

        <PillButton variant="orange" onClick={handleSave}>
          Save
        </PillButton>
      </div>
    </>
  );
}
