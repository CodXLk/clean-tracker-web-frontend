"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Loader2, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
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

export function SupervisorScheduleModal({ open, onClose, site }: SupervisorScheduleModalProps) {
  const supervisorsQuery = useSiteSupervisors(open ? site?.id : undefined);
  const schedulesQuery = useSupervisorSchedules(open ? site?.id : undefined);
  const upsert = useUpsertSupervisorSchedule(site?.id ?? "");
  const remove = useDeleteSupervisorSchedule(site?.id ?? "");

  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset the editor when the modal opens or the site changes (render-time reset per
  // React's "adjusting state when a prop changes" guidance — avoids an effect).
  const resetKey = `${open}:${site?.id ?? ""}`;
  const [lastResetKey, setLastResetKey] = useState(resetKey);
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    setForm(EMPTY);
    setEditingId(null);
    setError(null);
  }

  const supervisors = useMemo(() => supervisorsQuery.data ?? [], [supervisorsQuery.data]);
  const schedules = schedulesQuery.data ?? [];
  const busy = upsert.isPending || remove.isPending;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function startEdit(s: SupervisorSchedule) {
    setError(null);
    setEditingId(s.id);
    setForm({
      supervisorId: s.supervisorId,
      recurrenceType: s.recurrenceType,
      recurrenceInterval: s.recurrenceInterval || 1,
      daysOfWeek: (s.daysOfWeek ?? []) as DayOfWeek[],
      monthlyMode: s.weekOfMonth != null && s.monthlyWeekday != null ? "DAY_OF_WEEK" : "DAY_OF_MONTH",
      dayOfMonth: s.dayOfMonth ?? 1,
      weekOfMonth: s.weekOfMonth ?? 1,
      monthlyWeekday: (s.monthlyWeekday ?? null) as DayOfWeek | null,
    });
  }

  function resetForm() {
    setForm(EMPTY);
    setEditingId(null);
    setError(null);
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
    if (!site) return;
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
        dayOfMonth:
          form.recurrenceType === "MONTHLY" && !nthWeekday ? form.dayOfMonth : undefined,
        weekOfMonth: nthWeekday ? form.weekOfMonth : undefined,
        monthlyWeekday: nthWeekday ? form.monthlyWeekday : undefined,
      },
      {
        onSuccess: resetForm,
        onError: (e) => setError(getErrorMessage(e)),
      },
    );
  }

  // Supervisors without a schedule yet (plus the one being edited) can be picked.
  const scheduledIds = new Set(schedules.map((s) => s.supervisorId));
  const selectableSupervisors = supervisors.filter(
    (u) => !scheduledIds.has(u.id) || u.id === form.supervisorId,
  );
  const unit = form.recurrenceType === "DAILY" ? "day(s)" : form.recurrenceType === "WEEKLY" ? "week(s)" : "month(s)";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={site ? `Inspection schedule — ${site.name}` : "Inspection schedule"}
      description="Set how often each supervisor should inspect this site. This is a planning aid — it doesn't restrict when they can inspect."
      maxWidthClassName="max-w-2xl"
    >
      <div className="flex flex-col gap-5">
        {/* Existing schedules */}
        {schedulesQuery.isLoading ? (
          <div className="flex justify-center py-6 text-grey-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : schedules.length === 0 ? (
          <p className="rounded-xl border border-dashed border-grey-200 px-3 py-5 text-center text-sm text-grey-500">
            No inspection schedules yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {schedules.map((s) => (
              <li
                key={s.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-grey-200 p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-on-surface">{s.supervisorName}</p>
                  <p className="text-xs text-grey-600">{s.summary}</p>
                  {s.upcomingDates.length > 0 && (
                    <p className="mt-0.5 text-[11px] text-grey-500">
                      Next: {s.upcomingDates.slice(0, 3).map((d) => d).join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(s)}
                    disabled={busy}
                    aria-label="Edit schedule"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-grey-100 disabled:opacity-50"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove.mutate(s.id)}
                    disabled={busy}
                    aria-label="Delete schedule"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Editor */}
        <div className="rounded-xl border border-grey-200 p-4">
          <div className="mb-3 flex items-center gap-2">
            <CalendarClock size={18} className="text-primary" />
            <h3 className="text-sm font-semibold text-on-surface">
              {editingId ? "Edit schedule" : "Add schedule"}
            </h3>
          </div>

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
                <WorkingDaysSelector
                  value={form.daysOfWeek}
                  onChange={(next) => update("daysOfWeek", next)}
                />
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

            {error && (
              <p className="rounded-lg bg-error/10 px-3 py-2 text-xs font-medium text-error">{error}</p>
            )}

            <div className="flex gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={busy}
                  className="flex-1 rounded-xl border border-grey-300 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100 disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={onSubmit}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? "Save changes" : "Add schedule"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
