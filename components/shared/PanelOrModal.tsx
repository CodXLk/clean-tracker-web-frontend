"use client";

import { ArrowLeft } from "lucide-react";
import { Modal } from "./Modal";
import { cn } from "@/lib/utils/cn";

interface PanelOrModalProps {
  /** When true, render inline (as a sub-view with a Back button) instead of a modal dialog. */
  embedded?: boolean;
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Modal panel width (ignored when embedded). */
  maxWidthClassName?: string;
  /** Inline content max width when embedded. */
  embeddedMaxWidthClassName?: string;
}

/**
 * Renders its content either as a centered modal dialog (default) or, when {@code embedded},
 * as an in-page sub-view with a Back button — so an action's details get the full tab width.
 */
export function PanelOrModal({
  embedded = false,
  open,
  onClose,
  title,
  description,
  children,
  maxWidthClassName = "max-w-lg",
  embeddedMaxWidthClassName = "w-full",
}: PanelOrModalProps) {
  if (!embedded) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title={title}
        description={description}
        maxWidthClassName={maxWidthClassName}
      >
        {children}
      </Modal>
    );
  }

  if (!open) return null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 border-b border-line pb-4">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex w-fit items-center gap-1.5 rounded-full border border-grey-300 px-3.5 py-1.5 text-sm font-medium text-on-surface transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back
        </button>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-ink sm:text-xl">{title}</h2>
          {description && <p className="mt-1 text-sm text-body-2">{description}</p>}
        </div>
      </div>
      <div className={cn(embeddedMaxWidthClassName)}>{children}</div>
    </div>
  );
}
