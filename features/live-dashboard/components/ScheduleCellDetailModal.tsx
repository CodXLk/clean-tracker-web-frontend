"use client";

import { useMemo } from "react";
import { CheckCircle2, Clock, TriangleAlert } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import type { TaskOccurrence } from "@/features/workforce/schemas/assignment.schema";
import type { Complaint } from "@/features/complaints/schemas/complaint.schema";

interface ScheduleCellDetailModalProps {
  open: boolean;
  onClose: () => void;
  siteName: string;
  date: string;
  /** Occurrences at this site on this date (already filtered by the caller). */
  occurrences: TaskOccurrence[];
  /** Complaints raised for this site on this date. */
  complaints: Complaint[];
}

function formatDateLong(dateStr: string): string {
  const dt = new Date(dateStr + "T00:00:00");
  return dt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const COMPLAINT_STATUS_STYLE: Record<Complaint["status"], string> = {
  open: "bg-red-100 text-red-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-grey-100 text-grey-600",
};
const COMPLAINT_STATUS_LABEL: Record<Complaint["status"], string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export function ScheduleCellDetailModal({
  open,
  onClose,
  siteName,
  date,
  occurrences,
  complaints,
}: ScheduleCellDetailModalProps) {
  const active = useMemo(() => occurrences.filter((o) => o.status !== "CANCELLED"), [occurrences]);
  const total = active.length;
  const completed = active.filter((o) => o.status === "COMPLETED").length;
  const allDone = total > 0 && completed === total;

  // Group by area group (falling back to area), pending tasks first within each group.
  const groups = useMemo(() => {
    const byGroup = new Map<string, { label: string; tasks: TaskOccurrence[] }>();
    for (const o of active) {
      const label = o.areaGroupName || o.areaName || "General";
      const key = o.areaGroupId || o.areaId || label;
      const g = byGroup.get(key) ?? { label, tasks: [] };
      g.tasks.push(o);
      byGroup.set(key, g);
    }
    const list = [...byGroup.values()];
    for (const g of list) {
      g.tasks.sort((a, b) => {
        const ad = a.status === "COMPLETED" ? 1 : 0;
        const bd = b.status === "COMPLETED" ? 1 : 0;
        return ad - bd || a.name.localeCompare(b.name);
      });
    }
    // Groups with pending work first, then alphabetical.
    return list.sort((a, b) => {
      const ap = a.tasks.some((t) => t.status !== "COMPLETED") ? 0 : 1;
      const bp = b.tasks.some((t) => t.status !== "COMPLETED") ? 0 : 1;
      return ap - bp || a.label.localeCompare(b.label);
    });
  }, [active]);

  return (
    <Modal open={open} onClose={onClose} title={siteName} description={formatDateLong(date)} maxWidthClassName="max-w-xl">
      <div className="flex flex-col gap-4">
        {/* Summary */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
              allDone ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            {allDone ? <CheckCircle2 size={15} aria-hidden="true" /> : <Clock size={15} aria-hidden="true" />}
            {completed}/{total} tasks completed
          </span>
          {allDone && (
            <span className="text-sm font-medium text-emerald-700">Cleaning completed</span>
          )}
          {complaints.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
              <TriangleAlert size={15} aria-hidden="true" />
              {complaints.length} complaint{complaints.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {/* Complaints */}
        {complaints.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-grey-500">Complaints</h3>
            {complaints.map((c) => (
              <div key={c.id} className="rounded-xl border border-red-200 bg-red-50/60 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-on-surface">
                    {c.title}
                    {c.code && <span className="ml-1.5 text-xs font-normal text-grey-500">#{c.code}</span>}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${COMPLAINT_STATUS_STYLE[c.status]}`}>
                    {COMPLAINT_STATUS_LABEL[c.status]}
                  </span>
                </div>
                {(c.area || c.floor) && (
                  <p className="mt-0.5 text-xs text-grey-600">
                    {[c.floor, c.area].filter(Boolean).join(" · ")}
                  </p>
                )}
                {c.description && <p className="mt-1.5 text-sm text-on-surface">{c.description}</p>}
                {c.tasks.length > 0 && (
                  <p className="mt-1 text-xs text-grey-600">
                    Tasks: {c.tasks.map((t) => t.taskName).join(", ")}
                  </p>
                )}
                {c.photos.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {c.photos.map((p) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={p.id}
                        src={p.url}
                        alt="Complaint photo"
                        className="h-14 w-14 rounded-lg object-cover ring-1 ring-grey-200"
                      />
                    ))}
                  </div>
                )}
                <p className="mt-2 text-[11px] text-grey-500">
                  Raised by {c.reporterName || "Unknown"}
                  {c.reporterRole ? ` (${c.reporterRole})` : ""} · {formatWhen(c.reportedAt)}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Tasks grouped by area */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-grey-500">
            Areas &amp; tasks
          </h3>
          {groups.length === 0 ? (
            <p className="rounded-xl border border-dashed border-grey-200 px-3 py-6 text-center text-sm text-grey-500">
              No tasks scheduled for this day.
            </p>
          ) : (
            groups.map((g) => (
              <div key={g.label} className="rounded-xl border border-grey-200">
                <div className="border-b border-grey-200 bg-grey-50 px-3 py-2 text-sm font-semibold text-on-surface">
                  {g.label}
                </div>
                <ul className="divide-y divide-grey-100">
                  {g.tasks.map((t) => {
                    const done = t.status === "COMPLETED";
                    return (
                      <li key={`${t.taskId}_${t.occurrenceDate}`} className="flex items-center justify-between gap-3 px-3 py-2">
                        <span className="flex min-w-0 items-center gap-2">
                          {done ? (
                            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" aria-hidden="true" />
                          ) : (
                            <Clock size={16} className="shrink-0 text-amber-500" aria-hidden="true" />
                          )}
                          <span className="min-w-0 truncate text-sm text-on-surface">{t.name}</span>
                          {t.areaName && g.label !== t.areaName && (
                            <span className="shrink-0 text-xs text-grey-500">· {t.areaName}</span>
                          )}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            done ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {done ? "Completed" : "Pending"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
