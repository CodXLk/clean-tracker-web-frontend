"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PillButton } from "@/components/shared/PillButton";
import { SlideButton } from "@/components/shared/SlideButton";

export type ComplaintDetailState = "open" | "in_progress" | "completed" | "closed";

interface ComplaintDetailModalProps {
  open:              boolean;
  onClose:           () => void;
  title:             string;
  location:          string;
  ticketId:          string;
  state?:            ComplaintDetailState;
  onStartWorking?:   () => void;
  onUploadPhoto?:    () => void;
  onMarkComplete?:   () => void;
}

export function ComplaintDetailModal({
  open,
  onClose,
  title,
  location,
  ticketId,
  state = "open",
  onStartWorking,
  onUploadPhoto,
  onMarkComplete,
}: ComplaintDetailModalProps) {
  if (!open) return null;

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
        aria-label="Complaint detail"
        className={cn(
          "fixed z-50 bg-white p-6",
          "inset-x-0 bottom-0 rounded-t-3xl",
          "lg:inset-0 lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-md lg:rounded-3xl lg:shadow-2xl",
        )}
      >
        {/* Header */}
        <div className="mb-1 flex items-start justify-between gap-2">
          <span className="text-xs text-grey-500">Complaint Details</span>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="shrink-0 rounded-full p-0.5 text-danger transition-colors hover:bg-danger/10"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Description block */}
        <div className="mb-5">
          <p className="text-sm font-semibold text-on-surface leading-snug">{title}</p>
          <p className="mt-1 text-xs text-grey-500">{location}</p>
          <p className="text-xs text-grey-500">{ticketId}</p>
        </div>

        {/* Actions per state */}
        <div className="flex flex-col gap-3">
          {state === "open" && (
            <SlideButton
              label="Start working"
              variant="teal"
              onComplete={onStartWorking ?? onClose}
            />
          )}

          {state === "in_progress" && (
            <>
              <PillButton variant="orange" onClick={onUploadPhoto}>
                Upload a photo
              </PillButton>
              <SlideButton
                label="Slide to mark as complete"
                variant="teal"
                onComplete={onMarkComplete ?? onClose}
              />
            </>
          )}

          {state === "completed" && (
            <PillButton variant="success" disabled>
              Completed
            </PillButton>
          )}

          {state === "closed" && (
            <button
              disabled
              className="flex h-14 w-full items-center justify-center rounded-full bg-[#607D8B] text-sm font-semibold text-white cursor-not-allowed opacity-70"
            >
              Closed
            </button>
          )}
        </div>
      </div>
    </>
  );
}
