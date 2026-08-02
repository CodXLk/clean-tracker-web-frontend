"use client";

import { LogOut, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SignOutConfirmModalProps {
  open:       boolean;
  onConfirm:  () => void;
  onCancel:   () => void;
  isPending?: boolean;
}

export function SignOutConfirmModal({ open, onConfirm, onCancel, isPending = false }: SignOutConfirmModalProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => !isPending && onCancel()}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Confirm sign out"
        className={cn(
          "fixed z-50 bg-white p-6",
          "inset-x-0 bottom-0 rounded-t-3xl max-h-[85vh] overflow-y-auto",
          "lg:inset-0 lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-md lg:rounded-3xl lg:shadow-2xl",
        )}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-on-surface">Sign out</h2>
          <button
            onClick={onCancel}
            disabled={isPending}
            aria-label="Close"
            className="rounded-full p-0.5 text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger">
            <LogOut size={24} aria-hidden="true" />
          </span>
          <p className="text-sm text-grey-700">
            Are you sure you want to sign out?
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 rounded-xl border border-grey-300 px-4 py-3 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 rounded-xl bg-danger px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-danger/90 disabled:opacity-60"
          >
            {isPending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </>
  );
}
