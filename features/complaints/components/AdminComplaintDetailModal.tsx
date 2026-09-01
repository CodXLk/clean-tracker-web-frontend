"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, MessageSquare, User, Camera, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import type { Complaint } from "@/features/complaints/types";

interface AdminComplaintDetailModalProps {
  open:      boolean;
  onClose:   () => void;
  complaint: Complaint | null;
  role?:     string;
  onResolve: (id: string) => void;
  onComplete?: (id: string, note: string, photos: File[]) => void;
  resolving?:  boolean;
  completing?: boolean;
}

const STATUS_LABEL: Record<Complaint["status"], string> = {
  open:        "Open",
  in_progress: "In Progress",
  resolved:    "Resolved",
  closed:      "Awaiting review",
};

const STATUS_CLASSES: Record<Complaint["status"], string> = {
  open:        "bg-[#ED5F25]/10 text-[#ED5F25]",
  in_progress: "bg-primary/10 text-ink",
  resolved:    "bg-success/10 text-success",
  closed:      "bg-primary/10 text-ink",
};

export function AdminComplaintDetailModal({
  open,
  onClose,
  complaint,
  role,
  onResolve,
  onComplete,
  resolving,
  completing,
}: AdminComplaintDetailModalProps) {
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const previews = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const handleClose = useCallback(() => {
    setNote("");
    setPhotos([]);
    onClose();
  }, [onClose]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    if (open) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]);

  // Reset the completion form whenever a different complaint opens (render-time reset,
  // per React's "adjusting state when a prop changes" guidance — avoids an effect).
  const [formComplaintId, setFormComplaintId] = useState(complaint?.id);
  if (complaint?.id !== formComplaintId) {
    setFormComplaintId(complaint?.id);
    setNote("");
    setPhotos([]);
  }

  if (!open || !complaint) return null;

  const isCleaner = role === "CLEANER";
  // A cleaner redoes an open complaint; a supervisor/manager reviews a completed (closed) one.
  const canComplete = isCleaner && complaint.status === "open" && !!onComplete;
  const canResolve =
    complaint.status === "closed" && role !== "CLEANER" && role !== "CLIENT";

  function addPhotos(files: FileList | null) {
    if (!files) return;
    setPhotos((prev) => [...prev, ...Array.from(files)]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={handleClose} aria-hidden="true" />

      {/* Panel — bottom sheet on mobile (cleaner style), centered dialog on desktop (admin style) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="complaint-detail-title"
        className={cn(
          "fixed z-50 flex flex-col bg-surface",
          "inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl",
          "lg:inset-0 lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-xl lg:max-h-[85vh] lg:rounded-3xl lg:shadow-2xl",
        )}
      >
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ED5F25]/10">
              <MessageSquare size={24} className="text-[#ED5F25]" aria-hidden="true" />
            </div>
            <div>
              <h2 id="complaint-detail-title" className="text-lg font-medium text-on-surface">
                Complaint Details
              </h2>
              <p className="text-sm text-grey-500">ID: {complaint.code}</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close modal"
            onClick={handleClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-2">
          <div className="mb-4 flex items-center gap-2">
            <span className={cn("rounded-xl px-2.5 py-1 text-xs", STATUS_CLASSES[complaint.status])}>
              {STATUS_LABEL[complaint.status]}
            </span>
            <PriorityBadge priority={complaint.priority} />
          </div>

          <h3 className="text-base font-semibold text-on-surface">{complaint.title}</h3>
          <p className="mt-1 text-sm text-grey-500">{complaint.description}</p>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-grey-500">Location</p>
              <p className="mt-1 text-sm text-on-surface">{complaint.floor}</p>
              <p className="text-sm text-grey-500">{complaint.site}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-grey-500">Date &amp; Time</p>
              <p className="mt-1 text-sm text-on-surface">{complaint.reportedAt}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-grey-500">Submitted By</p>
              <div className="mt-1 flex items-center gap-2">
                <User size={16} className="text-grey-500" aria-hidden="true" />
                <span className="text-sm text-on-surface">{complaint.reporterRole}</span>
              </div>
            </div>
            {complaint.assignedTo && (
              <div>
                <p className="text-xs font-medium text-grey-500">Assigned To</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-xs font-semibold text-ink">
                    {complaint.assignedTo
                      .split(" ")
                      .map((p) => p[0])
                      .join("")}
                  </div>
                  <span className="text-sm text-on-surface">{complaint.assignedTo}</span>
                </div>
              </div>
            )}
          </div>

          {complaint.tasks.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-medium text-grey-500">Affected Tasks</p>
              <ul className="flex flex-col gap-1.5">
                {complaint.tasks.map((t) => (
                  <li
                    key={`${t.taskId}-${t.date}`}
                    className="rounded-xl bg-grey-100 px-3 py-2 text-xs text-on-surface"
                  >
                    <span className="font-medium">{t.taskName}</span>
                    {t.floor && <span className="text-grey-500"> · {t.floor}</span>}
                    {t.area && <span className="text-grey-500"> · {t.area}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {complaint.photos.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-medium text-grey-500">Photos</p>
              <div className="grid grid-cols-4 gap-2">
                {complaint.photos.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setLightboxUrl(`/api/complaints/photos/${p.id}`)}
                    aria-label="View photo full screen"
                    className="overflow-hidden rounded-lg"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/complaints/photos/${p.id}`}
                      alt="Complaint attachment"
                      className="aspect-square w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {(complaint.completionPhotos.length > 0 || complaint.completionNote || complaint.completedBy) && (
            <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/[0.04] p-4">
              <p className="text-xs font-semibold text-ink">Cleaner completion</p>
              {complaint.completedBy && (
                <p className="mt-1 text-xs text-grey-600">
                  Completed by {complaint.completedBy}
                  {complaint.completedAt ? ` · ${complaint.completedAt.slice(0, 10)}` : ""}
                </p>
              )}
              {complaint.completionNote && (
                <p className="mt-2 text-sm text-on-surface">{complaint.completionNote}</p>
              )}
              {complaint.completionPhotos.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {complaint.completionPhotos.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setLightboxUrl(`/api/complaints/photos/${p.id}`)}
                      aria-label="View photo full screen"
                      className="overflow-hidden rounded-lg"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/complaints/photos/${p.id}`}
                        alt="Completion attachment"
                        className="aspect-square w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-4">
          {canComplete ? (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-grey-300 py-2.5 text-sm font-medium text-grey-700 transition-colors hover:bg-grey-50"
                >
                  <Camera size={18} /> Take Photo
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-grey-300 py-2.5 text-sm font-medium text-grey-700 transition-colors hover:bg-grey-50"
                >
                  <ImagePlus size={18} /> Add Photos
                </button>
              </div>
              {photos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {previews.map((url, index) => (
                    <div key={url} className="relative h-16 w-16 overflow-hidden rounded-lg">
                      <button
                        type="button"
                        onClick={() => setLightboxUrl(url)}
                        aria-label="View photo full screen"
                        className="block h-full w-full"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        aria-label="Remove photo"
                        className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note (optional)"
                rows={2}
                maxLength={2048}
                className="w-full resize-none rounded-xl border border-grey-300 p-3 text-sm text-on-surface outline-none focus:border-primary"
              />
              <button
                type="button"
                disabled={completing}
                onClick={() => onComplete?.(complaint.id, note, photos)}
                className="h-11 w-full rounded-xl bg-primary text-sm font-medium text-white transition-colors hover:bg-primary-variant disabled:opacity-60"
              >
                {completing ? "Submitting…" : "Complete Complaint"}
              </button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={(e) => {
                  addPhotos(e.target.files);
                  e.target.value = "";
                }}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  addPhotos(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
          ) : canResolve ? (
            <button
              type="button"
              disabled={resolving}
              onClick={() => onResolve(complaint.id)}
              className="h-11 w-full rounded-xl bg-primary text-sm font-medium text-white transition-colors hover:bg-primary-variant disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {resolving ? "Resolving…" : "Mark as Resolved"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              className="h-11 w-full rounded-xl border border-grey-300 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Close
            </button>
          )}
        </div>
      </div>

      <ImageLightbox src={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </>
  );
}
