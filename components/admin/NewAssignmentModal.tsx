"use client";

import {
  useForm,
  useFormContext,
  useFieldArray,
  Controller,
  FormProvider,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Search, Check, Plus, Trash2, Clock } from "lucide-react";
import { useEffect, useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { SearchableSelect, type SelectOption } from "@/features/user-management/components/SearchableSelect";
import { WorkingDaysSelector } from "@/features/user-management/components/WorkingDaysSelector";
import { useSites } from "@/features/user-management/hooks/useSites";
import { useFloors } from "@/features/user-management/hooks/useFloors";
import { useAreas } from "@/features/user-management/hooks/useAreas";
import { useSiteCleaners } from "@/features/user-management/hooks/useSiteAssignments";
import { useCreateAssignment } from "@/features/workforce/hooks/useAssignments";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import type { Cleaner } from "@/features/cleaners/schemas/cleaner.schema";
import {
  AssignmentFormSchema,
  WORK_TYPE_LABELS,
  RECURRENCE_TYPE_LABELS,
  computeExpectedEndTime,
  type AssignmentFormInput,
  type WorkType,
  type RecurrenceType,
} from "@/features/workforce/schemas/assignment.schema";

export type AssignmentFormData = AssignmentFormInput;

const CLEANER_GRADIENTS: Array<{ from: string; to: string }> = [
  { from: "#2B7FFF", to: "#155DFC" },
  { from: "#AD46FF", to: "#9810FA" },
  { from: "#F6339A", to: "#E60076" },
  { from: "#00BC7D", to: "#009966" },
  { from: "#FE9A00", to: "#E17100" },
];

interface NewAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  defaultDate?: Date;
  defaultTime?: string;
}

function formatDateForInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function cleanerName(c: { firstName?: string | null; lastName?: string | null }): string {
  return [c.firstName, c.lastName].filter(Boolean).join(" ").trim() || "Unnamed cleaner";
}

function cleanerInitials(c: { firstName?: string | null; lastName?: string | null }): string {
  const first = c.firstName?.trim()?.[0] ?? "";
  const last = c.lastName?.trim()?.[0] ?? "";
  return (first + last).toUpperCase() || "?";
}

const EMPTY_TASK = {
  name: "",
  durationMinutes: undefined,
  floorId: "",
  areaId: "",
  description: "",
  cleanerIds: [] as string[],
};

function buildDefaults(defaultDate?: Date, defaultTime = ""): AssignmentFormInput {
  return {
    workType: "GENERAL_TASK",
    siteId: "",
    date: defaultDate ? formatDateForInput(defaultDate) : "",
    startTime: defaultTime,
    tasks: [{ ...EMPTY_TASK }],
    cleanerIds: [],
    assignPerTask: false,
    recurrenceType: "DAILY",
    recurrenceCount: 1,
    daysOfWeek: [],
    dayOfMonth: undefined,
    otherRepeatWorkingDays: false,
    otherUseRecurrence: false,
  };
}

const inputClass =
  "rounded-xl border px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary";

// ── Task card (own component so each row can load areas for its floor) ─────────

interface TaskCardProps {
  index: number;
  siteId: string;
  floorOptions: SelectOption[];
  floorsLoading: boolean;
  canRemove: boolean;
  onRemove: () => void;
  assignPerTask: boolean;
  cleaners: Cleaner[];
}

function AssignmentTaskCard({
  index,
  siteId,
  floorOptions,
  floorsLoading,
  canRemove,
  onRemove,
  assignPerTask,
  cleaners,
}: TaskCardProps) {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<AssignmentFormInput>();

  const floorId = watch(`tasks.${index}.floorId`);
  const selectedCleaners = watch(`tasks.${index}.cleanerIds`) ?? [];
  const areasQuery = useAreas(floorId || undefined);

  const areaOptions: SelectOption[] = useMemo(
    () => (areasQuery.data ?? []).map((a) => ({ value: a.id, label: a.name })),
    [areasQuery.data],
  );

  const taskErrors = errors.tasks?.[index];

  function toggleTaskCleaner(id: string) {
    const next = selectedCleaners.includes(id)
      ? selectedCleaners.filter((c) => c !== id)
      : [...selectedCleaners, id];
    setValue(`tasks.${index}.cleanerIds`, next, { shouldValidate: true });
  }

  return (
    <div className="rounded-2xl border border-grey-200 bg-white/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-on-surface">Task {index + 1}</span>
        {canRemove && (
          <button
            type="button"
            aria-label={`Remove task ${index + 1}`}
            onClick={onRemove}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-red-50 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Row 1: name + duration */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_160px]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`task-name-${index}`} className="text-sm font-medium text-on-surface">
            Task Name
          </label>
          <input
            id={`task-name-${index}`}
            type="text"
            placeholder="e.g., Vacuum office floor"
            {...register(`tasks.${index}.name`)}
            className={cn(inputClass, taskErrors?.name ? "border-danger" : "border-grey-300")}
          />
          {taskErrors?.name && <p className="text-xs text-danger">{taskErrors.name.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`task-duration-${index}`} className="text-sm font-medium text-on-surface">
            Duration (min)
          </label>
          <Controller
            name={`tasks.${index}.durationMinutes`}
            control={control}
            render={({ field }) => (
              <input
                id={`task-duration-${index}`}
                type="number"
                min="5"
                step="5"
                placeholder="Optional"
                value={field.value ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  field.onChange(v === "" ? undefined : parseInt(v, 10));
                }}
                className={cn(
                  inputClass,
                  taskErrors?.durationMinutes ? "border-danger" : "border-grey-300",
                )}
              />
            )}
          />
          {taskErrors?.durationMinutes && (
            <p className="text-xs text-danger">{taskErrors.durationMinutes.message}</p>
          )}
        </div>
      </div>

      {/* Row 2: floor + area */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <Controller
          name={`tasks.${index}.floorId`}
          control={control}
          render={({ field }) => (
            <SearchableSelect
              label="Floor"
              options={floorOptions}
              value={field.value || null}
              onChange={(v) => {
                field.onChange(v);
                setValue(`tasks.${index}.areaId`, "");
              }}
              disabled={!siteId}
              loading={floorsLoading && !!siteId}
              error={taskErrors?.floorId?.message}
              placeholder={siteId ? "Select floor" : "Select a site first"}
              emptyMessage="No floors for this site"
            />
          )}
        />
        <Controller
          name={`tasks.${index}.areaId`}
          control={control}
          render={({ field }) => (
            <SearchableSelect
              label="Area"
              options={areaOptions}
              value={field.value || null}
              onChange={(v) => field.onChange(v)}
              disabled={!floorId}
              loading={areasQuery.isLoading && !!floorId}
              error={taskErrors?.areaId?.message}
              placeholder={floorId ? "Select area" : "Select a floor first"}
              emptyMessage="No areas for this floor"
            />
          )}
        />
      </div>

      {/* Row 3: description */}
      <div className="mt-4 flex flex-col gap-1.5">
        <label htmlFor={`task-description-${index}`} className="text-sm font-medium text-on-surface">
          Description <span className="font-normal text-grey-500">(optional)</span>
        </label>
        <textarea
          id={`task-description-${index}`}
          rows={2}
          {...register(`tasks.${index}.description`)}
          className={cn("resize-none", inputClass, "border-grey-300")}
        />
      </div>

      {/* Per-task cleaner chips (only in per-task assignment mode) */}
      {assignPerTask && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-grey-500">Cleaners for this task</p>
          {cleaners.length === 0 ? (
            <p className="text-xs text-grey-500">No cleaners are assigned to this site.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {cleaners.map((cleaner) => {
                const isSelected = selectedCleaners.includes(cleaner.id);
                return (
                  <button
                    key={cleaner.id}
                    type="button"
                    onClick={() => toggleTaskCleaner(cleaner.id)}
                    aria-pressed={isSelected}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      isSelected
                        ? "border-primary bg-primary text-white"
                        : "border-grey-300 bg-white text-on-surface hover:border-primary",
                    )}
                  >
                    {isSelected && <Check size={12} aria-hidden="true" />}
                    {cleanerName(cleaner)}
                  </button>
                );
              })}
            </div>
          )}
          {taskErrors?.cleanerIds && (
            <p className="mt-1.5 text-xs text-danger">{taskErrors.cleanerIds.message}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Modal ───────────────────────────────────────────────────────────────────────

export function NewAssignmentModal({
  open,
  onClose,
  onCreated,
  defaultDate,
  defaultTime = "",
}: NewAssignmentModalProps) {
  const [cleanerSearch, setCleanerSearch] = useState("");

  const sitesQuery = useSites();
  const createMutation = useCreateAssignment();

  const methods = useForm<AssignmentFormInput>({
    resolver: zodResolver(AssignmentFormSchema),
    defaultValues: buildDefaults(defaultDate, defaultTime),
  });
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = methods;

  const { fields, append, remove } = useFieldArray({ control, name: "tasks" });

  const workType = watch("workType");
  const siteId = watch("siteId");
  const startTime = watch("startTime");
  const tasks = watch("tasks");
  const selectedCleaners = watch("cleanerIds");
  const assignPerTask = watch("assignPerTask");
  const recurrenceType = watch("recurrenceType");
  const otherRepeatWorkingDays = watch("otherRepeatWorkingDays");
  const otherUseRecurrence = watch("otherUseRecurrence");

  const showWorkingDays =
    workType === "GENERAL_TASK" || (workType === "OTHER" && otherRepeatWorkingDays);
  const showRecurrence =
    workType === "PERIODICAL_TASK" || (workType === "OTHER" && otherUseRecurrence);

  const floorsQuery = useFloors(siteId || undefined);
  // Only cleaners assigned to the selected site can be picked.
  const cleanersQuery = useSiteCleaners(siteId || undefined);

  const selectedSite = useMemo(
    () => (sitesQuery.data ?? []).find((s) => s.id === siteId),
    [sitesQuery.data, siteId],
  );

  const siteOptions: SelectOption[] = useMemo(
    () => (sitesQuery.data ?? []).map((s) => ({ value: s.id, label: s.name })),
    [sitesQuery.data],
  );
  const floorOptions: SelectOption[] = useMemo(
    () => (floorsQuery.data ?? []).map((f) => ({ value: f.id, label: f.name })),
    [floorsQuery.data],
  );
  const workTypeOptions: SelectOption[] = useMemo(
    () =>
      (Object.keys(WORK_TYPE_LABELS) as WorkType[]).map((t) => ({
        value: t,
        label: WORK_TYPE_LABELS[t],
      })),
    [],
  );

  const expectedEndTime = useMemo(
    () => computeExpectedEndTime(startTime, tasks ?? []),
    [startTime, tasks],
  );

  const cleaners = cleanersQuery.data ?? [];
  const filteredCleaners = cleaners.filter((c) =>
    cleanerName(c).toLowerCase().includes(cleanerSearch.toLowerCase()),
  );
  const allFilteredSelected =
    filteredCleaners.length > 0 && filteredCleaners.every((c) => selectedCleaners?.includes(c.id));

  useEffect(() => {
    if (open) {
      reset(buildDefaults(defaultDate, defaultTime));
      setCleanerSearch("");
      createMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultDate, defaultTime, reset]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    if (open) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]);

  function handleFormSubmit(data: AssignmentFormInput) {
    createMutation.mutate(data, {
      onSuccess: () => {
        onCreated?.();
        handleClose();
      },
    });
  }

  function toggleCleaner(id: string) {
    const current = selectedCleaners ?? [];
    if (current.includes(id)) {
      setValue("cleanerIds", current.filter((c) => c !== id), { shouldValidate: true });
    } else {
      setValue("cleanerIds", [...current, id], { shouldValidate: true });
    }
  }

  function toggleSelectAll() {
    const allIds = filteredCleaners.map((c) => c.id);
    const allSelected = allIds.every((id) => selectedCleaners?.includes(id));
    if (allSelected) {
      setValue("cleanerIds", (selectedCleaners ?? []).filter((id) => !allIds.includes(id)), {
        shouldValidate: true,
      });
    } else {
      const merged = Array.from(new Set([...(selectedCleaners ?? []), ...allIds]));
      setValue("cleanerIds", merged, { shouldValidate: true });
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-surface shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 id="modal-title" className="text-lg font-medium text-primary">
            Create New Assignment
          </h2>
          <button
            type="button"
            aria-label="Close modal"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="max-h-[70vh] overflow-y-auto px-6 pb-2">
              {/* Row 1: Work Type + Site */}
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="workType"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      label="Work Type"
                      options={workTypeOptions}
                      value={field.value || null}
                      onChange={(v) => field.onChange(v)}
                      error={errors.workType?.message}
                      placeholder="Select work type"
                    />
                  )}
                />
                <Controller
                  name="siteId"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      label="Site"
                      options={siteOptions}
                      value={field.value || null}
                      onChange={(v) => {
                        field.onChange(v);
                        // Floors/areas/cleaners are site-specific — reset dependants.
                        setValue("cleanerIds", []);
                        (tasks ?? []).forEach((_, i) => {
                          setValue(`tasks.${i}.floorId`, "");
                          setValue(`tasks.${i}.areaId`, "");
                          setValue(`tasks.${i}.cleanerIds`, []);
                        });
                      }}
                      loading={sitesQuery.isLoading}
                      error={errors.siteId?.message}
                      placeholder="Select site"
                    />
                  )}
                />
              </div>

              {/* Row 2: Date + Expected Start Time */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="assign-date" className="text-sm font-medium text-on-surface">
                    Date
                  </label>
                  <input
                    id="assign-date"
                    type="date"
                    {...register("date")}
                    className={cn(inputClass, errors.date ? "border-danger" : "border-grey-300")}
                  />
                  {errors.date && <p className="text-xs text-danger">{errors.date.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="assign-time" className="text-sm font-medium text-on-surface">
                    Expected Start Time
                  </label>
                  <input
                    id="assign-time"
                    type="time"
                    {...register("startTime")}
                    className={cn(inputClass, errors.startTime ? "border-danger" : "border-grey-300")}
                  />
                  {errors.startTime && (
                    <p className="text-xs text-danger">{errors.startTime.message}</p>
                  )}
                </div>
              </div>

              {/* Other: behaviour toggles */}
              {workType === "OTHER" && (
                <div className="mt-4 rounded-2xl border border-grey-200 bg-grey-100/40 p-4">
                  <p className="mb-2 text-sm font-medium text-on-surface">Custom behaviour</p>
                  <p className="mb-3 text-xs text-grey-500">
                    Combine behaviours — leave both off for a one-time assignment (like a work
                    order).
                  </p>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm text-on-surface">
                      <input
                        type="checkbox"
                        {...register("otherRepeatWorkingDays")}
                        className="h-4 w-4 rounded border-grey-300 accent-[#0B585A]"
                      />
                      Repeat on the site&apos;s working days (like General)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-on-surface">
                      <input
                        type="checkbox"
                        {...register("otherUseRecurrence")}
                        className="h-4 w-4 rounded border-grey-300 accent-[#0B585A]"
                      />
                      Use a custom recurrence rule (like Periodical)
                    </label>
                  </div>
                </div>
              )}

              {/* General (or Other + working-day fill): show the site's working days */}
              {showWorkingDays && (
                <div className="mt-4 rounded-2xl border border-grey-200 bg-primary/5 p-4">
                  <p className="mb-2 text-sm font-medium text-on-surface">
                    Site working days
                  </p>
                  {!siteId ? (
                    <p className="text-xs text-grey-500">
                      Select a site to see the days these tasks will repeat on.
                    </p>
                  ) : (selectedSite?.workingDays?.length ?? 0) > 0 ? (
                    <>
                      <WorkingDaysSelector value={selectedSite?.workingDays ?? []} readOnly />
                      <p className="mt-2 text-xs text-grey-500">
                        Tasks repeat on these days from the selected date
                        {selectedSite?.endDate
                          ? ` until the site end date (${selectedSite.endDate}).`
                          : " (no site end date set — the series is open-ended)."}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs font-medium text-[#E17100]">
                      This site has no working days configured — tasks will repeat every day.
                      Set working days in Site Management first if that is not intended.
                    </p>
                  )}
                </div>
              )}

              {/* Periodical (or Other + recurrence): recurrence settings */}
              {showRecurrence && (
                <div className="mt-4 rounded-2xl border border-grey-200 bg-grey-100/40 p-4">
                  <p className="mb-3 text-sm font-medium text-on-surface">Recurrence</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="assign-recurrence-type"
                        className="text-sm font-medium text-on-surface"
                      >
                        Recurrence Type
                      </label>
                      <select
                        id="assign-recurrence-type"
                        {...register("recurrenceType")}
                        className={cn(inputClass, "border-grey-300 bg-white")}
                      >
                        {(Object.keys(RECURRENCE_TYPE_LABELS) as RecurrenceType[]).map((r) => (
                          <option key={r} value={r}>
                            {RECURRENCE_TYPE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                      {errors.recurrenceType && (
                        <p className="text-xs text-danger">{errors.recurrenceType.message}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="assign-recurrence-count"
                        className="text-sm font-medium text-on-surface"
                      >
                        Repeat every
                      </label>
                      <div className="flex items-center gap-2">
                        <Controller
                          name="recurrenceCount"
                          control={control}
                          render={({ field }) => (
                            <input
                              id="assign-recurrence-count"
                              type="number"
                              min="1"
                              value={field.value ?? 1}
                              onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                              className={cn(inputClass, "w-20 border-grey-300 bg-white")}
                            />
                          )}
                        />
                        <span className="text-sm text-grey-500">
                          {recurrenceType === "DAILY"
                            ? "day(s)"
                            : recurrenceType === "WEEKLY"
                              ? "week(s)"
                              : "month(s)"}
                        </span>
                      </div>
                      {errors.recurrenceCount && (
                        <p className="text-xs text-danger">{errors.recurrenceCount.message}</p>
                      )}
                    </div>
                  </div>

                  {recurrenceType === "DAILY" && (
                    <p className="mt-3 text-xs text-grey-500">
                      Occurrences landing on non-working days of the site are skipped.
                    </p>
                  )}

                  {recurrenceType === "WEEKLY" && (
                    <div className="mt-3">
                      <p className="mb-2 text-sm font-medium text-on-surface">On days</p>
                      <Controller
                        name="daysOfWeek"
                        control={control}
                        render={({ field }) => (
                          <WorkingDaysSelector
                            value={field.value ?? []}
                            onChange={field.onChange}
                            error={errors.daysOfWeek?.message}
                          />
                        )}
                      />
                    </div>
                  )}

                  {recurrenceType === "MONTHLY" && (
                    <div className="mt-3 flex flex-col gap-1.5">
                      <label
                        htmlFor="assign-day-of-month"
                        className="text-sm font-medium text-on-surface"
                      >
                        Day of the month
                      </label>
                      <Controller
                        name="dayOfMonth"
                        control={control}
                        render={({ field }) => (
                          <select
                            id="assign-day-of-month"
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)
                            }
                            className={cn(inputClass, "w-40 border-grey-300 bg-white")}
                          >
                            <option value="">Select day</option>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                      {errors.dayOfMonth && (
                        <p className="text-xs text-danger">{errors.dayOfMonth.message}</p>
                      )}
                      <p className="text-xs text-grey-500">
                        Days beyond a month&apos;s length fall on its last day (e.g. 31 → Feb 28).
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tasks */}
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-on-surface">
                    Tasks
                    <span className="ml-2 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {fields.length}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => append({ ...EMPTY_TASK })}
                    className="flex items-center gap-1.5 rounded-xl border border-primary px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Plus size={14} aria-hidden="true" />
                    Add Task
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {fields.map((field, index) => (
                    <AssignmentTaskCard
                      key={field.id}
                      index={index}
                      siteId={siteId}
                      floorOptions={floorOptions}
                      floorsLoading={floorsQuery.isLoading}
                      canRemove={fields.length > 1}
                      onRemove={() => remove(index)}
                      assignPerTask={assignPerTask}
                      cleaners={cleaners}
                    />
                  ))}
                </div>
                {errors.tasks?.message && (
                  <p className="mt-2 text-xs text-danger">{errors.tasks.message}</p>
                )}
              </div>

              {/* Expected End Time (derived once tasks exist) */}
              {expectedEndTime && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary/5 px-4 py-3">
                  <Clock size={16} className="shrink-0 text-primary" aria-hidden="true" />
                  <span className="text-sm text-on-surface">
                    Expected End Time:{" "}
                    <span className="font-semibold text-primary">{expectedEndTime}</span>
                  </span>
                  <span className="ml-auto text-xs text-grey-500">
                    start + total task durations
                  </span>
                </div>
              )}

              {/* Cleaner assignment — after the task list */}
              <div className="mt-6">
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-sm font-medium text-on-surface">Assign Cleaners</span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {!siteId
                      ? "Select a site"
                      : cleanersQuery.isLoading
                        ? "Loading…"
                        : `${cleaners.length} available`}
                  </span>
                  <div className="ml-auto flex items-center gap-2 rounded-xl border border-grey-300 px-3 py-1.5">
                    <Search size={14} className="text-grey-500" aria-hidden="true" />
                    <input
                      type="text"
                      placeholder="Search cleaners"
                      value={cleanerSearch}
                      onChange={(e) => setCleanerSearch(e.target.value)}
                      className="w-32 text-xs text-on-surface outline-none placeholder:text-grey-500"
                      aria-label="Search cleaners"
                    />
                  </div>
                </div>

                {fields.length > 1 && (
                  <label className="mb-3 flex items-center gap-2 text-sm text-on-surface">
                    <input
                      type="checkbox"
                      {...register("assignPerTask")}
                      className="h-4 w-4 rounded border-grey-300 accent-[#0B585A]"
                    />
                    Assign cleaners per task (otherwise the selection below applies to all{" "}
                    {fields.length} tasks)
                  </label>
                )}

                {assignPerTask ? (
                  <p className="text-xs text-grey-500">
                    Pick cleaners on each task card above.
                  </p>
                ) : (
                  <>
                    {filteredCleaners.length > 0 && (
                      <div className="mb-3 flex items-center gap-2">
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={allFilteredSelected}
                          onClick={toggleSelectAll}
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                            allFilteredSelected
                              ? "border-primary bg-primary text-white"
                              : "border-grey-300 bg-white",
                          )}
                        >
                          {allFilteredSelected && <Check size={10} aria-hidden="true" />}
                        </button>
                        <span className="text-xs text-grey-500 select-none">
                          Select All (assign every cleaner)
                        </span>
                      </div>
                    )}

                    {!siteId ? (
                      <p className="text-xs text-grey-500">
                        Select a site to see its assigned cleaners.
                      </p>
                    ) : cleanersQuery.isLoading ? (
                      <p className="text-xs text-grey-500">Loading cleaners…</p>
                    ) : cleaners.length === 0 ? (
                      <p className="text-xs text-grey-500">
                        No cleaners are assigned to this site.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {filteredCleaners.map((cleaner, i) => {
                          const isSelected = selectedCleaners?.includes(cleaner.id) ?? false;
                          const gradient = CLEANER_GRADIENTS[i % CLEANER_GRADIENTS.length]!;
                          return (
                            <button
                              key={cleaner.id}
                              type="button"
                              onClick={() => toggleCleaner(cleaner.id)}
                              aria-pressed={isSelected}
                              className={cn(
                                "flex items-center gap-3 rounded-2xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                isSelected
                                  ? "border-primary bg-primary/5 ring-2 ring-primary"
                                  : "border-white/30 bg-white/60 hover:border-grey-300",
                              )}
                            >
                              <div className="relative shrink-0">
                                <div
                                  className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold text-white"
                                  style={{
                                    background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
                                  }}
                                  aria-hidden="true"
                                >
                                  {cleanerInitials(cleaner)}
                                </div>
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-on-surface">
                                  {cleanerName(cleaner)}
                                </p>
                                {cleaner.email && (
                                  <p className="truncate text-xs text-grey-500">{cleaner.email}</p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {errors.cleanerIds && (
                      <p className="mt-2 text-xs text-danger">{errors.cleanerIds.message}</p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-4">
              {createMutation.isError && (
                <p className="mb-3 text-sm text-danger">{getErrorMessage(createMutation.error)}</p>
              )}
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="h-11 w-full rounded-xl bg-primary text-sm font-medium text-white transition-colors hover:bg-primary-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createMutation.isPending ? "Creating…" : "Create Assignment"}
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
