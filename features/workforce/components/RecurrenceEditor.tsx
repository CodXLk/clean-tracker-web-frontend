"use client";

import { useState } from "react";
import { Repeat, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { WorkingDaysSelector } from "@/features/user-management/components/WorkingDaysSelector";
import {
  RECURRENCE_TYPE_LABELS,
  WEEK_OF_MONTH_OPTIONS,
  type RecurrenceType,
} from "@/features/workforce/schemas/assignment.schema";
import type { DayOfWeek } from "@/features/user-management/schemas/site.schema";

/** A per-task recurrence rule. When {@link recurrenceType} is undefined the task uses the
 *  assignment's own recurrence (no override). */
export interface RecurrenceValue {
  recurrenceType?: RecurrenceType;
  recurrenceInterval?: number;
  daysOfWeek: DayOfWeek[];
  monthlyMode: "DAY_OF_MONTH" | "DAY_OF_WEEK";
  dayOfMonth?: number;
  weekOfMonth?: number;
  monthlyWeekday?: DayOfWeek;
}

export function emptyRecurrence(): RecurrenceValue {
  return { daysOfWeek: [], monthlyMode: "DAY_OF_MONTH" };
}

/** Short human summary of a recurrence rule (e.g. "Weekly", "Every 2 days"), or null when unset. */
export function summarizeRecurrence(value: RecurrenceValue): string | null {
  if (!value.recurrenceType) return null;
  const n = value.recurrenceInterval && value.recurrenceInterval > 0 ? value.recurrenceInterval : 1;
  switch (value.recurrenceType) {
    case "DAILY":
      return n === 1 ? "Daily" : `Every ${n} days`;
    case "WEEKLY":
      return n === 1 ? "Weekly" : `Every ${n} weeks`;
    case "MONTHLY":
      return n === 1 ? "Monthly" : `Every ${n} months`;
    default:
      return null;
  }
}

interface RecurrenceEditorProps {
  value: RecurrenceValue;
  onChange: (next: RecurrenceValue) => void;
  /** Label for the enable toggle; defaults to a per-task override wording. */
  toggleLabel?: string;
  className?: string;
}

/**
 * Compact recurrence editor (type + interval + weekly days + monthly date/weekday),
 * driven by a plain value/onChange. Reused for per-task recurrence in the template
 * editor and the New Assignment form. Toggle off = no rule (undefined type).
 */
export function RecurrenceEditor({ value, onChange, toggleLabel, className }: RecurrenceEditorProps) {
  const enabled = value.recurrenceType != null;
  const type = value.recurrenceType;

  function patch(next: Partial<RecurrenceValue>) {
    onChange({ ...value, ...next });
  }

  return (
    <div className={cn("rounded-xl border border-grey-200 bg-white p-3", className)}>
      <label className="flex items-center gap-2 text-sm text-on-surface">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) =>
            patch({ recurrenceType: e.target.checked ? "DAILY" : undefined, recurrenceInterval: 1 })
          }
          className="h-4 w-4 rounded border-grey-300 accent-primary"
        />
        <Repeat size={14} className="text-primary" aria-hidden="true" />
        {toggleLabel ?? "Custom recurrence for this task"}
      </label>

      {enabled && (
        <div className="mt-3 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-grey-600">Repeats</span>
              <select
                value={type}
                onChange={(e) => patch({ recurrenceType: e.target.value as RecurrenceType })}
                className="rounded-lg border border-grey-300 bg-white px-2.5 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {(Object.keys(RECURRENCE_TYPE_LABELS) as RecurrenceType[]).map((r) => (
                  <option key={r} value={r}>
                    {RECURRENCE_TYPE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-grey-600">Repeat every</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={value.recurrenceInterval ?? 1}
                  onChange={(e) => patch({ recurrenceInterval: parseInt(e.target.value, 10) || 1 })}
                  className="w-20 rounded-lg border border-grey-300 bg-white px-2.5 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-xs text-grey-500">
                  {type === "DAILY" ? "day(s)" : type === "WEEKLY" ? "week(s)" : "month(s)"}
                </span>
              </div>
            </div>
          </div>

          {type === "WEEKLY" && (
            <div>
              <span className="mb-1.5 block text-xs font-medium text-grey-600">On days</span>
              <WorkingDaysSelector
                value={value.daysOfWeek}
                onChange={(days) => patch({ daysOfWeek: days })}
              />
            </div>
          )}

          {type === "MONTHLY" && (
            <div>
              <div className="mb-2 inline-flex overflow-hidden rounded-lg border border-grey-300">
                {(
                  [
                    ["DAY_OF_MONTH", "On a date"],
                    ["DAY_OF_WEEK", "On a weekday"],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => patch({ monthlyMode: mode })}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium transition-colors",
                      value.monthlyMode === mode
                        ? "bg-primary text-white"
                        : "bg-white text-on-surface hover:bg-grey-100",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {value.monthlyMode === "DAY_OF_MONTH" ? (
                <select
                  value={value.dayOfMonth ?? ""}
                  onChange={(e) =>
                    patch({ dayOfMonth: e.target.value ? parseInt(e.target.value, 10) : undefined })
                  }
                  className="block w-40 rounded-lg border border-grey-300 bg-white px-2.5 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select day</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-1.5">
                    {WEEK_OF_MONTH_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => patch({ weekOfMonth: opt.value })}
                        aria-pressed={value.weekOfMonth === opt.value}
                        className={cn(
                          "h-9 w-11 rounded-lg text-xs font-semibold transition-colors",
                          value.weekOfMonth === opt.value
                            ? "bg-primary text-white"
                            : "bg-white text-on-surface ring-1 ring-grey-300 hover:bg-grey-100",
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <WorkingDaysSelector
                    value={value.monthlyWeekday ? [value.monthlyWeekday] : []}
                    singleSelect
                    onChange={(days) => patch({ monthlyWeekday: days[0] })}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface RecurrenceDialogProps {
  taskName?: string;
  initialValue: RecurrenceValue;
  onSave: (value: RecurrenceValue) => void;
  onClose: () => void;
}

/**
 * Modal wrapper around {@link RecurrenceEditor}. Edits a local draft so changes are only
 * committed on "OK" (not on every keystroke) and are discarded on "Cancel".
 */
export function RecurrenceDialog({ taskName, initialValue, onSave, onClose }: RecurrenceDialogProps) {
  const [draft, setDraft] = useState<RecurrenceValue>(initialValue);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Task schedule"
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Repeat size={16} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-on-surface">Task schedule</h3>
              {taskName && <p className="truncate text-xs text-grey-500">{taskName}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <RecurrenceEditor
          value={draft}
          onChange={setDraft}
          toggleLabel="Repeat this task on a schedule (off = follow assignment recurrence)"
        />

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-grey-300 px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
