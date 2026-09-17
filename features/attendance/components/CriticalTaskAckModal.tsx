"use client";

import { useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { TaskOccurrence } from "@/features/tasks/schemas/task.schema";

/** Full URL for a served reference photo (browser → Next.js proxy → backend). */
function referencePhotoUrl(photoId: string): string {
  return `/api${ENDPOINTS.assignments.referencePhoto(photoId)}`;
}

interface CriticalTaskAckModalProps {
  siteName: string;
  tasks: TaskOccurrence[];
  onAcknowledge: () => void;
}

/** Shown right after check-in: the HIGH-priority tasks the cleaner must pay attention to,
 *  with the supervisor's note and any reference photos. The cleaner acknowledges to dismiss. */
export function CriticalTaskAckModal({ siteName, tasks, onAcknowledge }: CriticalTaskAckModalProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center gap-2.5 border-b border-grey-100 bg-danger/5 px-5 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-danger">
            <AlertTriangle size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-on-surface">High-priority tasks</h2>
            <p className="truncate text-xs text-grey-500">
              {tasks.length} task{tasks.length === 1 ? "" : "s"} need extra attention at {siteName}
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {tasks.map((task, i) => (
            <div
              key={task.taskId ?? i}
              className="rounded-2xl border border-danger/20 bg-danger/[0.03] p-3"
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger/10 text-[11px] font-bold text-danger">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-on-surface">{task.name}</p>
                  {task.areaName && (
                    <p className="text-xs text-grey-500">
                      {task.floorName ? `${task.floorName} · ` : ""}
                      {task.areaName}
                    </p>
                  )}
                </div>
              </div>
              {task.criticalNote && (
                <p className="mt-2 whitespace-pre-wrap rounded-lg bg-white px-3 py-2 text-xs leading-relaxed text-on-surface">
                  {task.criticalNote}
                </p>
              )}
              {(task.referencePhotoIds ?? []).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {(task.referencePhotoIds ?? []).map((photoId) => {
                    const url = referencePhotoUrl(photoId);
                    return (
                      <button
                        key={photoId}
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
          ))}
        </div>

        <div className="border-t border-grey-100 px-5 py-4">
          <button
            type="button"
            onClick={onAcknowledge}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            <Check size={16} aria-hidden="true" />
            Got it
          </button>
        </div>
      </div>

      <ImageLightbox src={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </div>
  );
}
