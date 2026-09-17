"use client";

import { useState } from "react";
import { Flag, MapPin, X } from "lucide-react";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import { PRIORITY_META } from "@/features/workforce/components/PriorityFlagMenu";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { TaskOccurrence } from "@/features/tasks/schemas/task.schema";

function referencePhotoUrl(photoId: string): string {
  return `/api${ENDPOINTS.assignments.referencePhoto(photoId)}`;
}

interface TaskInfoPopupProps {
  task: TaskOccurrence;
  /** For a grouped task: all member area names it covers. */
  memberAreas?: string[];
  onClose: () => void;
}

/** Task details popup: name, location, any notice, and (for HIGH tasks) the note + photos. */
export function TaskInfoPopup({ task, memberAreas = [], onClose }: TaskInfoPopupProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const isHigh = task.criticalLevel === "HIGH";
  const flagMeta =
    task.criticalLevel === "HIGH" || task.criticalLevel === "MEDIUM"
      ? PRIORITY_META[task.criticalLevel]
      : null;
  const photoIds = task.referencePhotoIds ?? [];

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-info-title"
        className="relative z-10 flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-grey-100 px-5 py-4">
          <div className="flex min-w-0 items-center gap-2">
            {flagMeta && (
              <Flag
                size={18}
                fill={flagMeta.fill}
                strokeWidth={1.75}
                className={flagMeta.text}
                aria-hidden="true"
              />
            )}
            <h2 id="task-info-title" className="min-w-0 text-base font-semibold text-on-surface">
              {task.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-grey-100"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {(task.floorName || task.areaName) && (
            <p className="flex items-center gap-1.5 text-sm text-grey-600">
              <MapPin size={14} aria-hidden="true" />
              {[task.floorName, task.areaName].filter(Boolean).join(" · ")}
            </p>
          )}

          {memberAreas.length > 1 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-grey-400">
                Covers areas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {memberAreas.map((area) => (
                  <span
                    key={area}
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-ink"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {task.shiftName && (
            <p className="text-sm text-grey-600">
              {task.shiftName}
              {task.shiftStartTime && task.shiftEndTime
                ? ` · ${task.shiftStartTime.slice(0, 5)}–${task.shiftEndTime.slice(0, 5)}`
                : ""}
            </p>
          )}

          {task.description && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-grey-400">Notice</p>
              <p className="whitespace-pre-wrap rounded-xl bg-grey-50 px-3 py-2 text-sm text-on-surface">
                {task.description}
              </p>
            </div>
          )}

          {isHigh && (
            <div className="rounded-xl border border-danger/20 bg-danger/[0.03] p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-danger">
                High-priority note
              </p>
              {task.criticalNote ? (
                <p className="whitespace-pre-wrap text-sm text-on-surface">{task.criticalNote}</p>
              ) : (
                <p className="text-sm text-grey-500">No note added.</p>
              )}
              {photoIds.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {photoIds.map((id) => {
                    const url = referencePhotoUrl(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setLightboxUrl(url)}
                        className="h-16 w-16 overflow-hidden rounded-lg border border-grey-200 transition-transform hover:scale-105"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="Reference" className="h-full w-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ImageLightbox src={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </div>
  );
}
