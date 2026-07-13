"use client";

import { useCallback, useEffect } from "react";
import { X, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import type { Complaint } from "@/features/complaints/types";

interface AdminComplaintDetailModalProps {
  open:      boolean;
  onClose:   () => void;
  complaint: Complaint | null;
  onResolve: (id: string) => void;
}

const STATUS_LABEL: Record<Complaint["status"], string> = {
  open:        "Open",
  in_progress: "In Progress",
  resolved:    "Resolved",
  closed:      "Closed",
};

const STATUS_CLASSES: Record<Complaint["status"], string> = {
  open:        "bg-[#ED5F25]/10 text-[#ED5F25]",
  in_progress: "bg-primary/10 text-primary",
  resolved:    "bg-success/10 text-success",
  closed:      "bg-grey-100 text-grey-700",
};

export function AdminComplaintDetailModal({
  open,
  onClose,
  complaint,
  onResolve,
}: AdminComplaintDetailModalProps) {
  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    if (open) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]);

  if (!open || !complaint) return null;

  const canResolve = complaint.status === "open" || complaint.status === "in_progress";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="complaint-detail-title"
    >
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-xl rounded-3xl bg-surface shadow-2xl">
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

        <div className="max-h-[70vh] overflow-y-auto px-6 pb-2">
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
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-xs font-semibold text-primary">
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

          <div className="mt-5">
            <p className="mb-3 text-xs font-medium text-grey-500">Activity Timeline</p>
            <div className="flex flex-col gap-4">
              {complaint.timeline.map((entry, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-on-surface">{entry.label}</p>
                    <p className="text-xs text-grey-500">{entry.at}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-4">
          {canResolve ? (
            <button
              type="button"
              onClick={() => {
                onResolve(complaint.id);
                handleClose();
              }}
              className="h-11 w-full rounded-xl bg-primary text-sm font-medium text-white transition-colors hover:bg-primary-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Mark as Resolved
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
    </div>
  );
}
