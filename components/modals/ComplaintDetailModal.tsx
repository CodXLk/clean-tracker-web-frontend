"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import type { Complaint } from "@/features/complaints/types";

const STATUS_LABEL: Record<Complaint["status"], string> = {
  open:        "Open",
  in_progress: "In Progress",
  resolved:    "Resolved",
  closed:      "Closed",
};

const STATUS_CLASSES: Record<Complaint["status"], string> = {
  open:        "bg-[#ED5F25]/15 text-[#ED5F25]",
  in_progress: "bg-primary/15 text-primary",
  resolved:    "bg-success/15 text-success",
  closed:      "bg-grey-200 text-grey-700",
};

interface ComplaintDetailModalProps {
  open:      boolean;
  onClose:   () => void;
  complaint: Complaint | null;
}

export function ComplaintDetailModal({ open, onClose, complaint }: ComplaintDetailModalProps) {
  if (!open || !complaint) return null;

  const location = [complaint.floor, complaint.area].filter(Boolean).join(" · ");

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
          "inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl",
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

        {/* Status + priority */}
        <div className="mb-3 flex items-center gap-2">
          <span className={cn("rounded-xl px-2.5 py-1 text-xs font-medium", STATUS_CLASSES[complaint.status])}>
            {STATUS_LABEL[complaint.status]}
          </span>
          <PriorityBadge priority={complaint.priority} />
        </div>

        {/* Title + location */}
        <div className="mb-4">
          <p className="text-sm font-semibold text-on-surface leading-snug">{complaint.title}</p>
          {location && <p className="mt-1 text-xs text-grey-500">{location}</p>}
          <p className="text-xs text-grey-500">{complaint.site}</p>
          <p className="text-xs text-grey-400">{complaint.code}</p>
        </div>

        {/* Description / note */}
        {complaint.description && (
          <div className="mb-4">
            <p className="mb-1 text-xs font-medium text-grey-500">Note</p>
            <p className="text-sm text-on-surface whitespace-pre-line">{complaint.description}</p>
          </div>
        )}

        {/* Affected tasks */}
        {complaint.tasks.length > 0 && (
          <div className="mb-4">
            <p className="mb-1.5 text-xs font-medium text-grey-500">Tasks</p>
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

        {/* Photos */}
        {complaint.photos.length > 0 && (
          <div className="mb-2">
            <p className="mb-1.5 text-xs font-medium text-grey-500">Photos</p>
            <div className="grid grid-cols-3 gap-2">
              {complaint.photos.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={p.id}
                  src={`/api/complaints/photos/${p.id}`}
                  alt="Complaint attachment"
                  className="aspect-square w-full rounded-xl object-cover"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
