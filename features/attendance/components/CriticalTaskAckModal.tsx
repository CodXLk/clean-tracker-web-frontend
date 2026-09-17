"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { TaskOccurrence } from "@/features/tasks/schemas/task.schema";

/** Full URL for a served reference photo (browser → Next.js proxy → backend). */
function referencePhotoUrl(photoId: string): string {
  return `/api${ENDPOINTS.assignments.referencePhoto(photoId)}`;
}

/** One task's reference images shown as a carousel with prev/next and click-to-enlarge. */
function TaskReferenceImages({
  photoIds,
  onOpen,
}: {
  photoIds: string[];
  onOpen: (url: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  if (photoIds.length === 0) return null;

  const clamped = Math.min(index, photoIds.length - 1);
  const currentId = photoIds[clamped]!;
  const currentUrl = referencePhotoUrl(currentId);
  const prev = () => setIndex((i) => (i - 1 + photoIds.length) % photoIds.length);
  const next = () => setIndex((i) => (i + 1) % photoIds.length);

  return (
    <div className="mt-3">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-grey-500">
        Reference images
      </p>
      <div className="relative overflow-hidden rounded-xl border border-grey-200 bg-grey-100">
        {failed[currentId] ? (
          <div className="flex h-48 w-full flex-col items-center justify-center gap-1 text-grey-400">
            <ImageOff size={22} aria-hidden="true" />
            <span className="text-[11px]">Image unavailable</span>
          </div>
        ) : (
          <button type="button" onClick={() => onOpen(currentUrl)} className="block w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUrl}
              alt={`Reference ${clamped + 1}`}
              onError={() => setFailed((f) => ({ ...f, [currentId]: true }))}
              className="h-48 w-full bg-black/5 object-contain"
            />
          </button>
        )}

        {photoIds.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
            <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
              {clamped + 1} / {photoIds.length}
            </span>
          </>
        )}
      </div>

      {photoIds.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {photoIds.map((id, i) => (
            <button
              key={id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`View image ${i + 1}`}
              className={
                "h-10 w-10 overflow-hidden rounded-md border transition-colors " +
                (i === clamped ? "border-primary ring-1 ring-primary" : "border-grey-200")
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={referencePhotoUrl(id)} alt={`Thumbnail ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface CriticalTaskAckModalProps {
  siteName: string;
  tasks: TaskOccurrence[];
  /** Called after the cleaner steps through every task and confirms. */
  onDone: () => void;
  /** Optional cancel (e.g. checkout: "keep working"). */
  onCancel?: () => void;
  /** Final-step button label. Default "Got it". */
  confirmLabel?: string;
  /** Show a completed/not-completed badge per task (used at checkout). */
  showCompletionStatus?: boolean;
}

/** Steps the cleaner through each HIGH-priority task one at a time (with note + reference
 *  images), then confirms. Used at check-in ("Got it") and checkout ("Confirm & check out"). */
export function CriticalTaskAckModal({
  siteName,
  tasks,
  onDone,
  onCancel,
  confirmLabel = "Got it",
  showCompletionStatus = false,
}: CriticalTaskAckModalProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  if (tasks.length === 0) return null;
  const clampedStep = Math.min(step, tasks.length - 1);
  const task = tasks[clampedStep]!;
  const isLast = clampedStep >= tasks.length - 1;
  const isCompleted = task.status === "COMPLETED";

  // Portal to <body>: an ancestor with backdrop-filter (mobile attendance card) would otherwise
  // become the containing block for this fixed overlay, shrinking it to the card on phones.
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center gap-2.5 border-b border-grey-100 bg-danger/5 px-5 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-danger">
            <AlertTriangle size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-on-surface">High-priority tasks</h2>
            <p className="truncate text-xs text-grey-500">
              Task {clampedStep + 1} of {tasks.length} at {siteName}
            </p>
          </div>
        </div>

        {/* Progress dots */}
        {tasks.length > 1 && (
          <div className="flex items-center gap-1.5 px-5 pt-3">
            {tasks.map((t, i) => (
              <span
                key={t.taskId ?? i}
                className={
                  "h-1.5 flex-1 rounded-full transition-colors " +
                  (i === clampedStep ? "bg-danger" : i < clampedStep ? "bg-danger/40" : "bg-grey-200")
                }
              />
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="rounded-2xl border border-danger/20 bg-danger/[0.03] p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-on-surface">{task.name}</p>
                {task.areaName && (
                  <p className="text-xs text-grey-500">
                    {task.floorName ? `${task.floorName} · ` : ""}
                    {task.areaName}
                  </p>
                )}
              </div>
              {showCompletionStatus && (
                <span
                  className={
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide " +
                    (isCompleted ? "bg-success/10 text-success" : "bg-danger/10 text-danger")
                  }
                >
                  {isCompleted ? "Completed" : "Not done"}
                </span>
              )}
            </div>
            {task.criticalNote && (
              <p className="mt-2 whitespace-pre-wrap rounded-lg bg-white px-3 py-2 text-xs leading-relaxed text-on-surface">
                {task.criticalNote}
              </p>
            )}
            <TaskReferenceImages photoIds={task.referencePhotoIds ?? []} onOpen={setLightboxUrl} />
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-grey-100 px-5 py-4">
          {clampedStep > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-grey-300 text-grey-600 transition-colors hover:bg-grey-100"
              aria-label="Previous task"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
          ) : onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="h-11 shrink-0 rounded-xl border border-grey-300 px-4 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100"
            >
              Keep working
            </button>
          ) : null}

          {isLast ? (
            <button
              type="button"
              onClick={onDone}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              <Check size={16} aria-hidden="true" />
              {confirmLabel}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(tasks.length - 1, s + 1))}
              className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Next
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <ImageLightbox src={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </div>,
    document.body,
  );
}
