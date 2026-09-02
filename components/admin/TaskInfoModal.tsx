"use client";

import { useState } from "react";
import { CalendarClock, MapPin, Pencil, Repeat, Trash2, UserCog, Users } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { InitialsAvatar } from "@/components/shared/InitialsAvatar";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { cn } from "@/lib/utils/cn";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import {
  useAssignment,
  useSoftDeleteTask,
  useDeleteOccurrence,
  fetchTaskCompletionCount,
} from "@/features/workforce/hooks/useAssignments";
import {
  WORK_TYPE_LABELS,
  RECURRENCE_TYPE_LABELS,
  type Assignment,
  type OccurrenceScope,
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
  // General (and working-day "Other") tasks without a custom rule repeat on the site's working days.
  if (a.assignmentType === "GENERAL_TASK" && !a.generalUseRecurrence) {
    return "Repeats on the site's working days";
  }
  if (a.assignmentType === "OTHER" && a.otherRepeatWorkingDays && !a.otherUseRecurrence) {
    return "Repeats on the site's working days";
  }
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
  const softDelete = useSoftDeleteTask();
  const deleteOccurrence = useDeleteOccurrence();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteScope, setDeleteScope] = useState<OccurrenceScope>("THIS");
  const [completionCount, setCompletionCount] = useState<number | null>(null);
  const [checkingCount, setCheckingCount] = useState(false);

  async function handleDeleteClick() {
    if (!occurrence) return;
    setCheckingCount(true);
    try {
      setCompletionCount(await fetchTaskCompletionCount(occurrence.taskId));
    } catch {
      setCompletionCount(0);
    } finally {
      setCheckingCount(false);
      setDeleteScope("THIS");
      setConfirmOpen(true);
    }
  }

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

        <div className="mt-1 flex items-center justify-between gap-3 border-t border-line pt-4">
          <button
            type="button"
            onClick={handleDeleteClick}
            disabled={checkingCount || softDelete.isPending}
            className="flex items-center gap-2 rounded-xl border border-error/40 px-4 py-2.5 text-sm font-semibold text-error transition-colors hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={16} aria-hidden="true" />
            {checkingCount ? "Checking…" : "Delete task"}
          </button>
          <div className="flex gap-3">
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
        </div>

        {assignmentQuery.isLoading && (
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        )}
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => {
          if (!softDelete.isPending && !deleteOccurrence.isPending) {
            setConfirmOpen(false);
            softDelete.reset();
            deleteOccurrence.reset();
          }
        }}
        title="Delete task"
        description={`Choose how much of “${occurrence.name}” to remove`}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <DeleteScopeOption
              checked={deleteScope === "THIS"}
              onSelect={() => setDeleteScope("THIS")}
              label="This date only"
              hint={`Remove just ${formatOccDate(occurrence.date)}. It stays on all other dates (next week and beyond).`}
            />
            <DeleteScopeOption
              checked={deleteScope === "THIS_AND_FOLLOWING"}
              onSelect={() => setDeleteScope("THIS_AND_FOLLOWING")}
              label="This and future dates"
              hint={`Remove ${formatOccDate(occurrence.date)} and every date after it. Past dates are kept.`}
            />
            <DeleteScopeOption
              checked={deleteScope === "ALL"}
              onSelect={() => setDeleteScope("ALL")}
              label="All dates (remove the task)"
              hint={
                completionCount && completionCount > 0
                  ? `Removes the task from every date. It has ${completionCount} recorded completion${completionCount === 1 ? "" : "s"}, so it is kept as deleted (restorable) and its history is preserved.`
                  : "Removes the task from every date. It is kept as deleted and can be restored later."
              }
            />
          </div>

          {(softDelete.isError || deleteOccurrence.isError) && (
            <p role="alert" className="rounded-xl bg-error/10 px-3 py-2 text-sm font-medium text-error">
              {getErrorMessage(softDelete.error ?? deleteOccurrence.error)}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              disabled={softDelete.isPending || deleteOccurrence.isPending}
              onClick={() => {
                if (!softDelete.isPending && !deleteOccurrence.isPending) setConfirmOpen(false);
              }}
              className="h-11 flex-1 rounded-xl border border-line text-sm font-semibold text-ink transition-colors hover:bg-surface-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={softDelete.isPending || deleteOccurrence.isPending}
              onClick={() => {
                const done = {
                  onSuccess: () => {
                    setConfirmOpen(false);
                    onClose();
                  },
                };
                if (deleteScope === "ALL") {
                  softDelete.mutate(occurrence.taskId, done);
                } else {
                  deleteOccurrence.mutate(
                    { taskId: occurrence.taskId, occurrenceDate: occurrence.occurrenceDate, scope: deleteScope },
                    done,
                  );
                }
              }}
              className="h-11 flex-1 rounded-xl bg-error text-sm font-semibold text-white transition-colors hover:bg-error/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {softDelete.isPending || deleteOccurrence.isPending ? "Please wait…" : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
}

function formatOccDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function DeleteScopeOption({
  checked,
  onSelect,
  label,
  hint,
}: {
  checked: boolean;
  onSelect: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
        checked ? "border-primary bg-primary/5" : "border-line hover:bg-surface-muted",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
          checked ? "border-primary" : "border-grey-400",
        )}
        aria-hidden="true"
      >
        {checked && <span className="h-2 w-2 rounded-full bg-primary" />}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-body-2">{hint}</span>
      </span>
    </button>
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
