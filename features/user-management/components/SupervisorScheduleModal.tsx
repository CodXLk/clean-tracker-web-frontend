"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Loader2, Pencil, Trash2, Plus, Eye } from "lucide-react";
import { PanelOrModal } from "@/components/shared/PanelOrModal";
import { Modal } from "@/components/shared/Modal";
import { ConfirmDialog } from "./ConfirmDialog";
import { WorkingDaysSelector } from "./WorkingDaysSelector";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useSiteSupervisors } from "@/features/user-management/hooks/useSiteAssignments";
import {
  useSupervisorSchedules,
  useUpsertSupervisorSchedule,
  useDeleteSupervisorSchedule,
} from "@/features/user-management/hooks/useSupervisorSchedules";
import {
  RECURRENCE_TYPE_LABELS,
  type RecurrenceType,
  type SupervisorSchedule,
} from "@/features/user-management/schemas/supervisorSchedule.schema";
import type { DayOfWeek, Site } from "@/features/user-management/schemas/site.schema";
import { cn } from "@/lib/utils/cn";

interface SupervisorScheduleModalProps {
  open: boolean;
  onClose: () => void;
  site: Site | null;
  embedded?: boolean;
}

type MonthlyMode = "DAY_OF_MONTH" | "DAY_OF_WEEK";
const RECURRENCE_TYPES: RecurrenceType[] = ["DAILY", "WEEKLY", "MONTHLY"];
const ORDINALS: Array<{ value: number; label: string }> = [
  { value: 1, label: "1st" },
  { value: 2, label: "2nd" },
  { value: 3, label: "3rd" },
  { value: 4, label: "4th" },
];

interface FormState {
  supervisorId: string;
  recurrenceType: RecurrenceType;
  recurrenceInterval: number;
  daysOfWeek: DayOfWeek[];
  monthlyMode: MonthlyMode;
  dayOfMonth: number;
  weekOfMonth: number;
  monthlyWeekday: DayOfWeek | null;
}

const EMPTY: FormState = {
  supervisorId: "",
  recurrenceType: "WEEKLY",
  recurrenceInterval: 1,
  daysOfWeek: [],
  monthlyMode: "DAY_OF_MONTH",
  dayOfMonth: 1,
  weekOfMonth: 1,
  monthlyWeekday: null,
};

export function SupervisorScheduleModal({ open, onClose, site, embedded }: SupervisorScheduleModalProps) {
  const schedulesQuery = useSupervisorSchedules(open ? site?.id : undefined);
  const remove = useDeleteSupervisorSchedule(site?.id ?? "");

  const [editor, setEditor] = useState<{ mode: "new" } | { mode: "edit"; schedule: SupervisorSchedule } | null>(null);
  const [viewing, setViewing] = useState<SupervisorSchedule | null>(null);
  const [deleting, setDeleting] = useState<SupervisorSchedule | null>(null);

  const schedules = schedulesQuery.data ?? [];

  function confirmDelete() {
    if (!deleting) return;
    remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
  }

  return (
    <>
      <PanelOrModal
        embedded={embedded}
        open={open}
        onClose={onClose}
        title={site ? `Inspection schedule — ${site.name}` : "Inspection schedule"}
        description="Set how often each supervisor should inspect this site. This is a planning aid — it doesn't restrict when they can inspect."
        maxWidthClassName="max-w-3xl"
      >
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setEditor({ mode: "new" })}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Add schedule
            </button>
          </div>

          {schedulesQuery.isLoading ? (
            <div className="flex justify-center py-10 text-grey-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : schedules.length === 0 ? (
            <p className="rounded-xl border border-dashed border-grey-200 px-3 py-10 text-center text-sm text-grey-500">
              No inspection schedules yet.
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-grey-200 bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-grey-200 text-xs uppercase tracking-wide text-grey-500">
                      <th className="px-4 py-3 font-medium">Supervisor</th>
                      <th className="px-4 py-3 font-medium">Recurrence</th>
                      <th className="px-4 py-3 font-medium">Next dates</th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((s) => (
                      <tr key={s.id} className="border-b border-grey-100 last:border-0">
                        <td className="px-4 py-3 font-medium text-on-surface">{s.supervisorName}</td>
                        <td className="px-4 py-3 text-grey-700">{s.summary}</td>
                        <td className="px-4 py-3 text-grey-600">
                          {s.upcomingDates.length > 0 ? s.upcomingDates.slice(0, 3).join(", ") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setViewing(s)}
                              aria-label="View schedule"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-primary/10 hover:text-ink"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditor({ mode: "edit", schedule: s })}
                              aria-label="Edit schedule"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-primary/10 hover:text-ink"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleting(s)}
                              aria-label="Delete schedule"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-error/10 hover:text-error"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </PanelOrModal>

      {site && editor && (
        <ScheduleEditorModal
          site={site}
          editing={editor.mode === "edit" ? editor.schedule : null}
          existingSchedules={schedules}
          onClose={() => setEditor(null)}
        />
      )}

      {viewing && (
        <ScheduleViewModal
          schedule={viewing}
          onEdit={() => {
            const current = viewing;
            setViewing(null);
            setEditor({ mode: "edit", schedule: current });
          }}
          onClose={() => setViewing(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete schedule"
        description={`Delete the inspection schedule for ${deleting?.supervisorName}? This cannot be undone.`}
        isPending={remove.isPending}
        error={remove.isError ? getErrorMessage(remove.error) : undefined}
        onConfirm={confirmDelete}
        onClose={() => {
          setDeleting(null);
          remove.reset();
        }}
      />
    </>
  );
}

interface ScheduleViewModalProps {
  schedule: SupervisorSchedule;
  onEdit: () => void;
  onClose: () => void;
}

function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function ScheduleViewModal({ schedule, onEdit, onClose }: ScheduleViewModalProps) {
  return (
    <Modal open onClose={onClose} title="Inspection schedule" maxWidthClassName="max-w-md">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-2xl border border-grey-200 bg-surface p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-ink">
            {initials(schedule.supervisorName)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-on-surface">{schedule.supervisorName}</p>
            <p className="text-xs text-grey-500">Supervisor</p>
          </div>
        </div>

        <div className="rounded-2xl border border-grey-200 bg-surface p-4">
          <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-grey-500">
            <CalendarClock size={14} /> Recurrence
          </p>
          <p className="text-sm text-on-surface">{schedule.summary}</p>
        </div>

        <div className="rounded-2xl border border-grey-200 bg-surface p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-grey-500">Upcoming inspections</p>
          {schedule.upcomingDates.length === 0 ? (
            <p className="text-sm text-grey-500">No upcoming dates.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {schedule.upcomingDates.map((d) => (
                <li
                  key={d}
                  className="rounded-full border border-grey-200 bg-grey-50 px-3 py-1 text-xs font-medium text-grey-700"
                >
                  {d}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-grey-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-grey-300 px-4 py-2 text-sm font-semibold text-on-surface hover:bg-grey-100"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <Pencil className="h-4 w-4" /> Edit
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface ScheduleEditorModalProps {
  site: Site;
  editing: SupervisorSchedule | null;
  existingSchedules: SupervisorSchedule[];
  onClose: () => void;
}

function ScheduleEditorModal({ site, editing, existingSchedules, onClose }: ScheduleEditorModalProps) {
  const supervisorsQuery = useSiteSupervisors(site.id);
  const upsert = useUpsertSupervisorSchedule(site.id);

  const [form, setForm] = useState<FormState>(() =>
    editing
      ? {
          supervisorId: editing.supervisorId,
          recurrenceType: editing.recurrenceType,
          recurrenceInterval: editing.recurrenceInterval || 1,
          daysOfWeek: (editing.daysOfWeek ?? []) as DayOfWeek[],
          monthlyMode:
            editing.weekOfMonth != null && editing.monthlyWeekday != null ? "DAY_OF_WEEK" : "DAY_OF_MONTH",
          dayOfMonth: editing.dayOfMonth ?? 1,
          weekOfMonth: editing.weekOfMonth ?? 1,
          monthlyWeekday: (editing.monthlyWeekday ?? null) as DayOfWeek | null,
        }
      : EMPTY,
  );
  const [error, setError] = useState<string | null>(null);

  const supervisors = useMemo(() => supervisorsQuery.data ?? [], [supervisorsQuery.data]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): string | null {
    if (!form.supervisorId) return "Select a supervisor.";
    if (form.recurrenceInterval < 1) return "Repeat interval must be at least 1.";
    if (form.recurrenceType === "WEEKLY" && form.daysOfWeek.length === 0) {
      return "Select at least one day of the week.";
    }
    if (form.recurrenceType === "MONTHLY" && form.monthlyMode === "DAY_OF_WEEK" && !form.monthlyWeekday) {
      return "Select a weekday for the monthly rule.";
    }
    return null;
  }

  function onSubmit() {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    const nthWeekday = form.recurrenceType === "MONTHLY" && form.monthlyMode === "DAY_OF_WEEK";
    upsert.mutate(
      {
        supervisorId: form.supervisorId,
        recurrenceType: form.recurrenceType,
        recurrenceInterval: form.recurrenceInterval,
        daysOfWeek: form.recurrenceType === "WEEKLY" ? form.daysOfWeek : undefined,
        dayOfMonth: form.recurrenceType === "MONTHLY" && !nthWeekday ? form.dayOfMonth : undefined,
        weekOfMonth: nthWeekday ? form.weekOfMonth : undefined,
        monthlyWeekday: nthWeekday ? form.monthlyWeekday : undefined,
      },
      {
        onSuccess: onClose,
        onError: (e) => setError(getErrorMessage(e)),
      },
    );
  }

  // Supervisors without a schedule yet (plus the one being edited) can be picked.
  const scheduledIds = new Set(existingSchedules.map((s) => s.supervisorId));
  const selectableSupervisors = supervisors.filter(
    (u) => !scheduledIds.has(u.id) || u.id === form.supervisorId,
  );
  const unit = form.recurrenceType === "DAILY" ? "day(s)" : form.recurrenceType === "WEEKLY" ? "week(s)" : "month(s)";

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? "Edit schedule" : "Add schedule"}
      description="Set how often this supervisor should inspect the site."
      maxWidthClassName="max-w-lg"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-on-surface">Supervisor</label>
          <select
            value={form.supervisorId}
            onChange={(e) => update("supervisorId", e.target.value)}
            className="rounded-xl border border-grey-300 px-3 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="">Select a supervisor…</option>
            {selectableSupervisors.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName}
              </option>
            ))}
          </select>
          {supervisors.length === 0 && !supervisorsQuery.isLoading && (
            <p className="text-xs text-grey-500">
              No supervisors assigned to this site yet. Assign supervisors first.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-on-surface">Recurrence type</span>
          <div className="flex gap-2">
            {RECURRENCE_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => update("recurrenceType", t)}
                className={cn(
                  "flex-1 rounded-xl border py-2 text-sm font-medium transition-colors",
                  form.recurrenceType === t
                    ? "border-primary bg-primary text-white"
                    : "border-grey-300 text-on-surface hover:bg-grey-100",
                )}
              >
                {RECURRENCE_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-on-surface">Repeat every</span>
          <input
            type="number"
            min={1}
            value={form.recurrenceInterval}
            onChange={(e) => update("recurrenceInterval", Math.max(1, Number(e.target.value) || 1))}
            className="w-20 rounded-xl border border-grey-300 px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <span className="text-sm text-grey-600">{unit}</span>
        </div>

        {form.recurrenceType === "WEEKLY" && (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-on-surface">On days</span>
            <WorkingDaysSelector value={form.daysOfWeek} onChange={(next) => update("daysOfWeek", next)} />
          </div>
        )}

        {form.recurrenceType === "MONTHLY" && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => update("monthlyMode", "DAY_OF_MONTH")}
                className={cn(
                  "flex-1 rounded-xl border py-2 text-sm font-medium transition-colors",
                  form.monthlyMode === "DAY_OF_MONTH"
                    ? "border-primary bg-primary text-white"
                    : "border-grey-300 text-on-surface hover:bg-grey-100",
                )}
              >
                On a date
              </button>
              <button
                type="button"
                onClick={() => update("monthlyMode", "DAY_OF_WEEK")}
                className={cn(
                  "flex-1 rounded-xl border py-2 text-sm font-medium transition-colors",
                  form.monthlyMode === "DAY_OF_WEEK"
                    ? "border-primary bg-primary text-white"
                    : "border-grey-300 text-on-surface hover:bg-grey-100",
                )}
              >
                On a weekday
              </button>
            </div>

            {form.monthlyMode === "DAY_OF_MONTH" ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-on-surface">Day of the month</span>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={form.dayOfMonth}
                  onChange={(e) =>
                    update("dayOfMonth", Math.min(31, Math.max(1, Number(e.target.value) || 1)))
                  }
                  className="w-20 rounded-xl border border-grey-300 px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <span className="text-sm text-on-surface">On the…</span>
                <div className="flex gap-2">
                  {ORDINALS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => update("weekOfMonth", o.value)}
                      className={cn(
                        "flex-1 rounded-xl border py-2 text-sm font-medium transition-colors",
                        form.weekOfMonth === o.value
                          ? "border-primary bg-primary text-white"
                          : "border-grey-300 text-on-surface hover:bg-grey-100",
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                <WorkingDaysSelector
                  singleSelect
                  value={form.monthlyWeekday ? [form.monthlyWeekday] : []}
                  onChange={(next) => update("monthlyWeekday", next[0] ?? null)}
                />
              </div>
            )}
          </div>
        )}

        {error && <p className="rounded-lg bg-error/10 px-3 py-2 text-xs font-medium text-error">{error}</p>}

        <div className="flex gap-2 border-t border-grey-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={upsert.isPending}
            className="flex-1 rounded-xl border border-grey-300 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={upsert.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {upsert.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Save changes" : "Add schedule"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
