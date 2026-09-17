"use client";

import { CalendarClock, ClipboardList, FileText, Repeat, UserCog, Users } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { InitialsAvatar } from "@/components/shared/InitialsAvatar";
import {
  WORK_TYPE_LABELS,
  type TaskOccurrence,
  type WorkType,
} from "@/features/workforce/schemas/assignment.schema";

const DAY_SHORT: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

function recurrenceLabel(o: TaskOccurrence): string {
  if (!o.recurrenceType) return o.recurring ? "Repeats" : "One-off";
  const n = o.recurrenceInterval && o.recurrenceInterval > 0 ? o.recurrenceInterval : 1;
  if (o.recurrenceType === "WEEKLY") {
    const days = (o.recurrenceDays ?? []).map((d) => DAY_SHORT[d] ?? d).join(", ");
    if (n === 1) return days ? `Every ${days}` : "Weekly";
    return days ? `Every ${n} weeks · ${days}` : `Every ${n} weeks`;
  }
  if (o.recurrenceType === "DAILY") return n === 1 ? "Daily" : `Every ${n} days`;
  return n === 1 ? "Monthly" : `Every ${n} months`;
}

function personName(c: { firstName?: string | null; lastName?: string | null }): string {
  return [c.firstName, c.lastName].filter(Boolean).join(" ").trim();
}

function formatDateLong(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

interface TypeDetailsModalProps {
  type: WorkType | string;
  date: string;
  occurrences: TaskOccurrence[];
  hex: string;
  onClose: () => void;
}

/** All tasks of one work type on one day — names, times, recurrence, cleaners, supervisors. */
export function TypeDetailsModal({ type, date, occurrences, hex, onClose }: TypeDetailsModalProps) {
  const label = WORK_TYPE_LABELS[type as WorkType] ?? type;
  const sorted = [...occurrences].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const isWorkOrder = type === "WORK_ORDER";
  const poIds = Array.from(new Set(occurrences.map((o) => o.poId).filter(Boolean))) as string[];
  const workOrderScope = Array.from(
    new Set(occurrences.map((o) => o.workOrderDescription).filter(Boolean)),
  ) as string[];

  return (
    <Modal
      open
      onClose={onClose}
      title={label}
      description={`${occurrences.length} task${occurrences.length === 1 ? "" : "s"} · ${formatDateLong(date)}`}
    >
      <div className="flex flex-col gap-3">
        {isWorkOrder && (poIds.length > 0 || workOrderScope.length > 0) && (
          <div className="flex flex-col gap-2.5 rounded-2xl border border-line bg-surface-muted px-3 py-2.5">
            {poIds.length > 0 && (
              <div className="flex items-center gap-2">
                <FileText size={15} className="shrink-0 text-body-2" aria-hidden="true" />
                <span className="text-xs font-medium text-body-2">PO ID</span>
                <span className="truncate text-sm font-semibold text-ink">{poIds.join(", ")}</span>
              </div>
            )}
            {workOrderScope.length > 0 && (
              <div className="flex items-start gap-2">
                <ClipboardList size={15} className="mt-0.5 shrink-0 text-body-2" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-body-2">What needs to be done</p>
                  {workOrderScope.map((s, i) => (
                    <p key={i} className="whitespace-pre-line text-sm text-ink">
                      {s}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {sorted.map((o) => {
          const cleaners = (o.cleaners ?? []).filter((c) => personName(c));
          const supervisors = (o.supervisors ?? []).filter((s) => personName(s));
          return (
            <div key={`${o.taskId}_${o.occurrenceDate}`} className="rounded-2xl border border-line p-3">
              <div className="flex items-start gap-2.5">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: hex }} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{o.name}</p>
                  <p className="mt-0.5 text-xs text-body-2">
                    {[o.floorName, o.areaName].filter(Boolean).join(" · ")}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-body-2">
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock size={13} aria-hidden="true" />
                      {o.startTime.slice(0, 5)} – {o.endTime.slice(0, 5)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Repeat size={13} aria-hidden="true" />
                      {recurrenceLabel(o)}
                    </span>
                  </div>

                  {!isWorkOrder && o.description && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs">
                      <ClipboardList size={13} className="mt-0.5 shrink-0 text-body-2" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="font-medium text-ink">What needs to be done</p>
                        <p className="whitespace-pre-line text-body-2">{o.description}</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-2 flex flex-col gap-1.5">
                    <div className="flex items-start gap-1.5 text-xs">
                      <Users size={13} className="mt-0.5 shrink-0 text-body-2" aria-hidden="true" />
                      {cleaners.length ? (
                        <ul className="flex flex-wrap gap-1.5">
                          {cleaners.map((c) => (
                            <li key={c.id} className="flex items-center gap-1 rounded-full border border-line bg-surface-muted py-0.5 pl-0.5 pr-2">
                              <InitialsAvatar name={personName(c)} size={18} />
                              <span className="font-medium text-ink">{personName(c)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-body-2">No cleaner assigned</span>
                      )}
                    </div>
                    <div className="flex items-start gap-1.5 text-xs">
                      <UserCog size={13} className="mt-0.5 shrink-0 text-body-2" aria-hidden="true" />
                      {supervisors.length ? (
                        <ul className="flex flex-wrap gap-1.5">
                          {supervisors.map((s) => (
                            <li key={s.id} className="flex items-center gap-1 rounded-full border border-line bg-surface-muted py-0.5 pl-0.5 pr-2">
                              <InitialsAvatar name={personName(s)} size={18} />
                              <span className="font-medium text-ink">{personName(s)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-body-2">No supervisor assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
