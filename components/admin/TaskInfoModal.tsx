"use client";

import { CalendarClock, MapPin, Pencil, Repeat, UserCog, Users } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { InitialsAvatar } from "@/components/shared/InitialsAvatar";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useAssignment } from "@/features/workforce/hooks/useAssignments";
import {
  WORK_TYPE_LABELS,
  RECURRENCE_TYPE_LABELS,
  type Assignment,
  type TaskOccurrence,
} from "@/features/workforce/schemas/assignment.schema";

interface TaskInfoModalProps {
  occurrence: TaskOccurrence | null;
  onClose: () => void;
  onEditTask: (assignment: Assignment) => void;
}

function personName(c: { firstName?: string | null; lastName?: string | null }): string {
  return [c.firstName, c.lastName].filter(Boolean).join(" ").trim();
}

const DAY_SHORT: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

function recurrenceSummary(a: Assignment): string {
  if (!a.recurring || !a.recurrenceType) return "One-off — does not repeat";
  const type = RECURRENCE_TYPE_LABELS[a.recurrenceType];
  const n = a.recurrenceInterval ?? 1;
  const every =
    n > 1
      ? `Every ${n} ${a.recurrenceType === "DAILY" ? "days" : a.recurrenceType === "WEEKLY" ? "weeks" : "months"}`
      : type;
  if (a.recurrenceType === "WEEKLY" && a.daysOfWeek.length) {
    return `${every} · ${a.daysOfWeek.map((d) => DAY_SHORT[d] ?? d).join(", ")}`;
  }
  return every;
}

/** Brief read-only summary of a scheduled task, with an entry into the full editor. */
export function TaskInfoModal({ occurrence, onClose, onEditTask }: TaskInfoModalProps) {
  const open = !!occurrence;
  const assignmentQuery = useAssignment(open ? occurrence!.assignmentId : undefined);
  const assignment = assignmentQuery.data;

  if (!occurrence) return null;

  const cleaners = occurrence.cleaners.filter((c) => personName(c));
  const supervisors = occurrence.supervisors.filter((s) => personName(s));

  return (
    <Modal open={open} onClose={onClose} title={occurrence.name} description="Task details">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-ink">
            {WORK_TYPE_LABELS[occurrence.assignmentType]}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 text-xs text-body-2">
            <MapPin size={13} aria-hidden="true" />
            {[occurrence.floorName, occurrence.areaName].filter(Boolean).join(" · ")}
          </span>
        </div>

        <InfoRow icon={Repeat} label="Recurrence">
          {assignmentQuery.isLoading ? (
            <span className="text-body-2">Loading…</span>
          ) : assignment ? (
            <span className="text-ink">{recurrenceSummary(assignment)}</span>
          ) : (
            <span className="text-body-2">{occurrence.recurring ? "Repeats" : "One-off"}</span>
          )}
        </InfoRow>

        <InfoRow icon={CalendarClock} label="Time">
          <span className="text-ink">
            {occurrence.startTime.slice(0, 5)} – {occurrence.endTime.slice(0, 5)}
          </span>
        </InfoRow>

        <InfoRow icon={Users} label="Cleaners">
          {cleaners.length ? (
            <ul className="flex flex-wrap gap-2">
              {cleaners.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-2 rounded-full border border-line bg-surface-muted py-1 pl-1 pr-3"
                >
                  <InitialsAvatar name={personName(c)} size={22} />
                  <span className="text-xs font-medium text-ink">{personName(c)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-body-2">No cleaner assigned</span>
          )}
        </InfoRow>

        <InfoRow icon={UserCog} label="Supervisors">
          {supervisors.length ? (
            <ul className="flex flex-wrap gap-2">
              {supervisors.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-2 rounded-full border border-line bg-surface-muted py-1 pl-1 pr-3"
                >
                  <InitialsAvatar name={personName(s)} size={22} />
                  <span className="text-xs font-medium text-ink">{personName(s)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-body-2">No supervisor assigned</span>
          )}
        </InfoRow>

        <div className="mt-1 flex justify-end gap-3 border-t border-line pt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-line px-5 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted"
          >
            Close
          </button>
          <button
            type="button"
            disabled={!assignment}
            onClick={() => assignment && onEditTask(assignment)}
            className="flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-variant disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Pencil size={16} aria-hidden="true" />
            Edit task
          </button>
        </div>

        {assignmentQuery.isLoading && (
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        )}
      </div>
    </Modal>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="flex w-28 shrink-0 items-center gap-2 pt-0.5 text-sm font-medium text-body-2">
        <Icon size={15} aria-hidden />
        {label}
      </span>
      <div className="min-w-0 flex-1 text-sm">{children}</div>
    </div>
  );
}
