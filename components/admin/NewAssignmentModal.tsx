"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Search, Check } from "lucide-react";
import { useEffect, useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { SearchableSelect, type SelectOption } from "@/features/user-management/components/SearchableSelect";
import { useSites } from "@/features/user-management/hooks/useSites";
import { useFloors } from "@/features/user-management/hooks/useFloors";
import { useAreas } from "@/features/user-management/hooks/useAreas";
import { useCleaners } from "@/features/cleaners/hooks/useCleaners";
import { useCreateAssignment } from "@/features/workforce/hooks/useTaskAssignments";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import {
  AssignmentFormSchema,
  ASSIGNMENT_TYPE_LABELS,
  RECURRENCE_TYPE_LABELS,
  type AssignmentFormInput,
  type AssignmentType,
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

function buildDefaults(defaultDate?: Date, defaultTime = ""): AssignmentFormInput {
  return {
    date: defaultDate ? formatDateForInput(defaultDate) : "",
    time: defaultTime,
    name: "",
    siteId: "",
    floorId: "",
    areaId: "",
    assignmentType: "GENERAL_TASK",
    durationHours: 1,
    description: "",
    cleanerIds: [],
    recurrenceType: "DAILY",
    recurrenceCount: 1,
  };
}

export function NewAssignmentModal({
  open,
  onClose,
  onCreated,
  defaultDate,
  defaultTime = "",
}: NewAssignmentModalProps) {
  const [cleanerSearch, setCleanerSearch] = useState("");

  const sitesQuery = useSites();
  const cleanersQuery = useCleaners();
  const createMutation = useCreateAssignment();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AssignmentFormInput>({
    resolver: zodResolver(AssignmentFormSchema),
    defaultValues: buildDefaults(defaultDate, defaultTime),
  });

  const siteId = watch("siteId");
  const floorId = watch("floorId");
  const assignmentType = watch("assignmentType");
  const selectedCleaners = watch("cleanerIds");
  const isPeriodical = assignmentType === "PERIODICAL_TASK";

  const floorsQuery = useFloors(siteId || undefined);
  const areasQuery = useAreas(floorId || undefined);

  const siteOptions: SelectOption[] = useMemo(
    () => (sitesQuery.data ?? []).map((s) => ({ value: s.id, label: s.name })),
    [sitesQuery.data],
  );
  const floorOptions: SelectOption[] = useMemo(
    () => (floorsQuery.data ?? []).map((f) => ({ value: f.id, label: f.name })),
    [floorsQuery.data],
  );
  const areaOptions: SelectOption[] = useMemo(
    () => (areasQuery.data ?? []).map((a) => ({ value: a.id, label: a.name })),
    [areasQuery.data],
  );
  const assignmentTypeOptions: SelectOption[] = useMemo(
    () =>
      (Object.keys(ASSIGNMENT_TYPE_LABELS) as AssignmentType[]).map((t) => ({
        value: t,
        label: ASSIGNMENT_TYPE_LABELS[t],
      })),
    [],
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

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="max-h-[70vh] overflow-y-auto px-6 pb-2">
            {/* Row 1: Date + Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="assign-date" className="text-sm font-medium text-on-surface">
                  Date
                </label>
                <input
                  id="assign-date"
                  type="date"
                  {...register("date")}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary",
                    errors.date ? "border-danger" : "border-grey-300",
                  )}
                />
                {errors.date && <p className="text-xs text-danger">{errors.date.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="assign-time" className="text-sm font-medium text-on-surface">
                  Time
                </label>
                <input
                  id="assign-time"
                  type="time"
                  {...register("time")}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary",
                    errors.time ? "border-danger" : "border-grey-300",
                  )}
                />
                {errors.time && <p className="text-xs text-danger">{errors.time.message}</p>}
              </div>
            </div>

            {/* Row 2: Task Name */}
            <div className="mt-4 flex flex-col gap-1.5">
              <label htmlFor="assign-task-name" className="text-sm font-medium text-on-surface">
                Task Name
              </label>
              <input
                id="assign-task-name"
                type="text"
                placeholder="e.g., Weekly office cleaning"
                {...register("name")}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary",
                  errors.name ? "border-danger" : "border-grey-300",
                )}
              />
              {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
            </div>

            {/* Row 3: Site + Floor (dependent) */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Controller
                name="siteId"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    label="Select Site"
                    options={siteOptions}
                    value={field.value || null}
                    onChange={(v) => {
                      field.onChange(v);
                      setValue("floorId", "");
                      setValue("areaId", "");
                    }}
                    loading={sitesQuery.isLoading}
                    error={errors.siteId?.message}
                    placeholder="Select site"
                  />
                )}
              />
              <Controller
                name="floorId"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    label="Select Floor"
                    options={floorOptions}
                    value={field.value || null}
                    onChange={(v) => {
                      field.onChange(v);
                      setValue("areaId", "");
                    }}
                    disabled={!siteId}
                    loading={floorsQuery.isLoading && !!siteId}
                    error={errors.floorId?.message}
                    placeholder={siteId ? "Select floor" : "Select a site first"}
                    emptyMessage="No floors for this site"
                  />
                )}
              />
            </div>

            {/* Row 4: Assignment Type + Area (dependent) */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Controller
                name="assignmentType"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    label="Assignment Type"
                    options={assignmentTypeOptions}
                    value={field.value || null}
                    onChange={(v) => field.onChange(v)}
                    error={errors.assignmentType?.message}
                    placeholder="Select type"
                  />
                )}
              />
              <Controller
                name="areaId"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    label="Select Area"
                    options={areaOptions}
                    value={field.value || null}
                    onChange={(v) => field.onChange(v)}
                    disabled={!floorId}
                    loading={areasQuery.isLoading && !!floorId}
                    error={errors.areaId?.message}
                    placeholder={floorId ? "Select area" : "Select a floor first"}
                    emptyMessage="No areas for this floor"
                  />
                )}
              />
            </div>

            {/* Row 5: Duration hours */}
            <div className="mt-4 flex flex-col gap-1.5">
              <label htmlFor="assign-duration" className="text-sm font-medium text-on-surface">
                Duration (hours)
              </label>
              <Controller
                name="durationHours"
                control={control}
                render={({ field }) => (
                  <input
                    id="assign-duration"
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    placeholder="2"
                    value={field.value}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary",
                      errors.durationHours ? "border-danger" : "border-grey-300",
                    )}
                  />
                )}
              />
              {errors.durationHours && (
                <p className="text-xs text-danger">{errors.durationHours.message}</p>
              )}
            </div>

            {/* Row 6: Recurrence (Periodical Task only) */}
            {isPeriodical && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="assign-recurrence-type" className="text-sm font-medium text-on-surface">
                    Recurrence Type
                  </label>
                  <select
                    id="assign-recurrence-type"
                    {...register("recurrenceType")}
                    className="rounded-xl border border-grey-300 px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
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
                  <label htmlFor="assign-recurrence-count" className="text-sm font-medium text-on-surface">
                    Recurrence Count
                  </label>
                  <Controller
                    name="recurrenceCount"
                    control={control}
                    render={({ field }) => (
                      <input
                        id="assign-recurrence-count"
                        type="number"
                        min="1"
                        placeholder="1"
                        value={field.value ?? 1}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                        className="rounded-xl border border-grey-300 px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    )}
                  />
                  {errors.recurrenceCount && (
                    <p className="text-xs text-danger">{errors.recurrenceCount.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Row 7: Description */}
            <div className="mt-4 flex flex-col gap-1.5">
              <label htmlFor="assign-description" className="text-sm font-medium text-on-surface">
                Description
              </label>
              <textarea
                id="assign-description"
                rows={3}
                {...register("description")}
                className="resize-none rounded-xl border border-grey-300 px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Row 8: Select Cleaner */}
            <div className="mt-6">
              <div className="mb-3 flex items-center gap-3">
                <span className="text-sm font-medium text-on-surface">Select Cleaner</span>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {cleanersQuery.isLoading ? "Loading…" : `${cleaners.length} available`}
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
                  <span className="text-xs text-grey-500 select-none">Select All</span>
                </div>
              )}

              {cleanersQuery.isLoading ? (
                <p className="text-xs text-grey-500">Loading cleaners…</p>
              ) : cleaners.length === 0 ? (
                <p className="text-xs text-grey-500">No cleaners found.</p>
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
                            style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
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
      </div>
    </div>
  );
}
