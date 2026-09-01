"use client";

import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/shared/Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isPending?: boolean;
  error?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  isPending,
  error,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-error/10 text-error">
            <AlertTriangle size={20} aria-hidden="true" />
          </div>
          <p className="pt-0.5 text-sm leading-relaxed text-body-2">{description}</p>
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-error/10 px-3 py-2 text-sm font-medium text-error">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="h-11 flex-1 rounded-xl border border-line text-sm font-semibold text-ink transition-colors hover:bg-surface-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="h-11 flex-1 rounded-xl bg-error text-sm font-semibold text-white transition-colors hover:bg-error/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
