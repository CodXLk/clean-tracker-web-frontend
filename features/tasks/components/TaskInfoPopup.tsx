"use client";

import { useState } from "react";
import { Flag, MapPin, MessageSquare, X } from "lucide-react";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import { PRIORITY_META } from "@/features/workforce/components/PriorityFlagMenu";
import { useComplaints } from "@/features/complaints/hooks/useComplaints";
import { useTaskHistory } from "@/features/tasks/hooks/useTasks";
import { useMe } from "@/features/auth/hooks/useMe";
import { isAdminRole } from "@/lib/auth/roles";
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

  // Supervisors/management reviewing a task see the cleaner's before/after photos + note (from
  // the task's completion history); cleaners just see their own uploaded photos.
  const role = useMe().data?.role;
  const canReview = role === "SUPERVISOR" || isAdminRole(role);
  const historyQuery = useTaskHistory(
    canReview && task.taskId ? (task.taskId as string) : null,
    task.date,
    canReview && !!task.taskId,
  );
  const reviewDay = historyQuery.data?.days.find((d) => d.date === task.date);
  const beforePhotos = (reviewDay?.photos ?? []).filter((p) => (p.type ?? "AFTER") === "BEFORE");
  const afterPhotos = (reviewDay?.photos ?? []).filter((p) => (p.type ?? "AFTER") === "AFTER");

  // For a complaint redo, surface the supervisor's note + photos from the originating complaint.
  const complaintsQuery = useComplaints();
  const complaint = task.complaintId
    ? (complaintsQuery.data?.complaints ?? []).find((c) => c.id === task.complaintId)
    : undefined;

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

          {complaint && (
            <div className="rounded-xl border border-[#ED5F25]/25 bg-[#ED5F25]/[0.04] p-3">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#ED5F25]">
                <MessageSquare size={13} aria-hidden="true" /> Complaint from supervisor
              </p>
              {complaint.description ? (
                <p className="whitespace-pre-wrap text-sm text-on-surface">{complaint.description}</p>
              ) : (
                <p className="text-sm text-grey-500">No note added.</p>
              )}
              {complaint.photos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {complaint.photos.map((p) => {
                    const url = `/api${ENDPOINTS.complaints.photo(p.id)}`;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setLightboxUrl(url)}
                        className="h-16 w-16 overflow-hidden rounded-lg border border-grey-200 transition-transform hover:scale-105"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="Complaint" className="h-full w-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {reviewDay && (reviewDay.photos.length > 0 || reviewDay.note) ? (
            <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
                Cleaner&apos;s work
              </p>
              {reviewDay.note && (
                <p className="mb-2 whitespace-pre-wrap text-sm text-on-surface">{reviewDay.note}</p>
              )}
              {([["BEFORE", beforePhotos], ["AFTER", afterPhotos]] as const).map(([label, list]) =>
                list.length === 0 ? null : (
                  <div key={label} className="mb-2 last:mb-0">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-grey-500">
                      {label === "BEFORE" ? "Before" : "After"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {list.map((p) => {
                        const url = `/api${ENDPOINTS.tasks.photo(p.id)}`;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setLightboxUrl(url)}
                            className="h-16 w-16 overflow-hidden rounded-lg border border-grey-200 transition-transform hover:scale-105"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="Cleaner upload" className="h-full w-full object-cover" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (task.completionPhotoIds?.length ?? 0) > 0 ? (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-grey-400">
                Cleaner&apos;s photos
              </p>
              <div className="flex flex-wrap gap-2">
                {(task.completionPhotoIds ?? []).map((id) => {
                  const url = `/api${ENDPOINTS.tasks.photo(id)}`;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setLightboxUrl(url)}
                      className="h-16 w-16 overflow-hidden rounded-lg border border-grey-200 transition-transform hover:scale-105"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="Cleaner upload" className="h-full w-full object-cover" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

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
