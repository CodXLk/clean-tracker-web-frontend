"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PillButton } from "@/components/shared/PillButton";
import { SlideButton } from "@/components/shared/SlideButton";

export type TaskDetailState = "start" | "in_progress" | "completed";

interface TaskDetailModalProps {
  open:            boolean;
  onClose:         () => void;
  description:     string;
  state?:          TaskDetailState;
  onStart?:        () => void;
  onComplete?:     () => void;
  onUploadPhoto?:  () => void;
  onAddNote?:      () => void;
}

export function TaskDetailModal({
  open,
  onClose,
  description,
  state = "start",
  onStart,
  onComplete,
  onUploadPhoto,
  onAddNote,
}: TaskDetailModalProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel — bottom sheet on mobile, centered on desktop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Task detail"
        className={cn(
          "fixed z-50 bg-white p-6",
          // Mobile: bottom sheet
          "inset-x-0 bottom-0 rounded-t-3xl",
          // Desktop: centered modal
          "lg:inset-0 lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-md lg:rounded-3xl lg:shadow-2xl",
        )}
      >
        {/* Header */}
        <div className="mb-1 flex items-start justify-between gap-2">
          <span className="text-xs text-grey-500">Description</span>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="shrink-0 rounded-full p-0.5 text-danger transition-colors hover:bg-danger/10"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Description */}
        <p className="mb-5 text-sm font-semibold text-on-surface leading-snug">
          {description}
        </p>

        {/* Actions per state */}
        <div className="flex flex-col gap-3">
          {state === "start" && (
            <SlideButton
              label="Slide to start task"
              variant="orange"
              onComplete={onStart ?? onClose}
            />
          )}

          {state === "in_progress" && (
            <>
              <PillButton variant="orange" onClick={onUploadPhoto}>
                Upload a photo
              </PillButton>
              <PillButton variant="orange" onClick={onAddNote}>
                Add note
              </PillButton>
              <SlideButton
                label="Slide to mark as complete"
                variant="teal"
                onComplete={onComplete ?? onClose}
              />
            </>
          )}

          {state === "completed" && (
            <PillButton variant="success" disabled>
              Completed
            </PillButton>
          )}
        </div>
      </div>
    </>
  );
}
