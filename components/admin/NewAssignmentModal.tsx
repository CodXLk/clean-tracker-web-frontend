"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Search, Check } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils/cn";

const assignmentSchema = z.object({
  date: z.string().min(1, "Date required"),
  time: z.string().min(1, "Time required"),
  taskName: z.string().min(1, "Task name required"),
  site: z.string().min(1, "Site required"),
  floor: z.string().min(1, "Floor required"),
  assignmentType: z.string().min(1, "Assignment type required"),
  area: z.string().min(1, "Area required"),
  durationHours: z.number().min(0.5, "Minimum 0.5 hours").max(24, "Maximum 24 hours"),
  durationType: z.string(),
  durationCount: z.number().min(1),
  description: z.string(),
  selectedCleaners: z.array(z.string()),
});

export type AssignmentFormData = z.infer<typeof assignmentSchema>;

const SITE_OPTIONS = ["Site A", "Site B", "Site C", "Site D"] as const;

const FLOOR_OPTIONS = [
  "Ground Floor",
  "Floor 1",
  "Floor 2",
  "Floor 3",
  "Floor 4",
  "Floor 5",
  "Basement",
] as const;

const AREA_OPTIONS = [
  "Offices",
  "Lobby",
  "Restrooms",
  "Break Room",
  "Conference Room",
  "Reception",
  "Corridors",
  "Parking Area",
  "Stairwells",
  "Warehouse",
] as const;

const ASSIGNMENT_TYPE_OPTIONS = ["General Task", "Periodical Task", "Work Orders"] as const;

interface CleanerOption {
  id: string;
  initials: string;
  name: string;
  site: string;
  tasks: number;
  gradientFrom: string;
  gradientTo: string;
}

const CLEANERS: CleanerOption[] = [
  { id: "jd", initials: "JD", name: "Jane Doe",      site: "Site A", tasks: 5, gradientFrom: "#2B7FFF", gradientTo: "#155DFC" },
  { id: "js", initials: "JS", name: "John Smith",    site: "Site A", tasks: 7, gradientFrom: "#AD46FF", gradientTo: "#9810FA" },
  { id: "mg", initials: "MG", name: "Maria Garcia",  site: "Site B", tasks: 4, gradientFrom: "#F6339A", gradientTo: "#E60076" },
  { id: "cw", initials: "CW", name: "Chen Wei",      site: "Site C", tasks: 6, gradientFrom: "#00BC7D", gradientTo: "#009966" },
  { id: "sj", initials: "SJ", name: "Sarah Johnson", site: "Site B", tasks: 8, gradientFrom: "#FE9A00", gradientTo: "#E17100" },
];

interface NewAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: AssignmentFormData) => void;
  defaultDate?: Date;
  defaultTime?: string;
}

function formatDateForInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function NewAssignmentModal({
  open,
  onClose,
  onSubmit,
  defaultDate,
  defaultTime = "",
}: NewAssignmentModalProps) {
  const [cleanerSearch, setCleanerSearch] = useState("");

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      date: defaultDate ? formatDateForInput(defaultDate) : "",
      time: defaultTime,
      taskName: "",
      site: "",
      floor: "",
      assignmentType: "",
      area: "",
      durationHours: 1,
      durationType: "Daily",
      durationCount: 1,
      description: "",
      selectedCleaners: [],
    },
  });

  const assignmentType = watch("assignmentType");
  const isPeriodical = assignmentType === "Periodical Task";
  const selectedCleaners = watch("selectedCleaners");

  useEffect(() => {
    if (open) {
      reset({
        date: defaultDate ? formatDateForInput(defaultDate) : "",
        time: defaultTime,
        taskName: "",
        site: "",
        floor: "",
        assignmentType: "",
        area: "",
        durationHours: 1,
        durationType: "Daily",
        durationCount: 1,
        description: "",
        selectedCleaners: [],
      });
      setCleanerSearch("");
    }
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

  function handleFormSubmit(data: AssignmentFormData) {
    onSubmit?.(data);
    handleClose();
  }

  function toggleCleaner(id: string) {
    const current = selectedCleaners ?? [];
    if (current.includes(id)) {
      setValue("selectedCleaners", current.filter((c) => c !== id));
    } else {
      setValue("selectedCleaners", [...current, id]);
    }
  }

  function toggleSelectAll() {
    const allIds = filteredCleaners.map((c) => c.id);
    const allSelected = allIds.every((id) => selectedCleaners?.includes(id));
    if (allSelected) {
      setValue(
        "selectedCleaners",
        (selectedCleaners ?? []).filter((id) => !allIds.includes(id)),
      );
    } else {
      const existing = selectedCleaners ?? [];
      const merged = Array.from(new Set([...existing, ...allIds]));
      setValue("selectedCleaners", merged);
    }
  }

  const filteredCleaners = CLEANERS.filter((c) =>
    c.name.toLowerCase().includes(cleanerSearch.toLowerCase()) ||
    c.site.toLowerCase().includes(cleanerSearch.toLowerCase()),
  );

  const allFilteredSelected =
    filteredCleaners.length > 0 &&
    filteredCleaners.every((c) => selectedCleaners?.includes(c.id));

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-surface shadow-2xl">
        {/* Header */}
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

        {/* Scrollable form body */}
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
                {errors.date && (
                  <p className="text-xs text-danger">{errors.date.message}</p>
                )}
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
                {errors.time && (
                  <p className="text-xs text-danger">{errors.time.message}</p>
                )}
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
                {...register("taskName")}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary",
                  errors.taskName ? "border-danger" : "border-grey-300",
                )}
              />
              {errors.taskName && (
                <p className="text-xs text-danger">{errors.taskName.message}</p>
              )}
            </div>

            {/* Row 3: Select Site + Select Floor */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="assign-site" className="text-sm font-medium text-on-surface">
                  Select Site
                </label>
                <select
                  id="assign-site"
                  {...register("site")}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary",
                    errors.site ? "border-danger" : "border-grey-300",
                  )}
                >
                  <option value="">Select site</option>
                  {SITE_OPTIONS.map((site) => (
                    <option key={site} value={site}>{site}</option>
                  ))}
                </select>
                {errors.site && (
                  <p className="text-xs text-danger">{errors.site.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="assign-floor" className="text-sm font-medium text-on-surface">
                  Select Floor
                </label>
                <select
                  id="assign-floor"
                  {...register("floor")}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary",
                    errors.floor ? "border-danger" : "border-grey-300",
                  )}
                >
                  <option value="">Select floor</option>
                  {FLOOR_OPTIONS.map((floor) => (
                    <option key={floor} value={floor}>{floor}</option>
                  ))}
                </select>
                {errors.floor && (
                  <p className="text-xs text-danger">{errors.floor.message}</p>
                )}
              </div>
            </div>

            {/* Row 4: Assignment Type + Select Area */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="assign-type" className="text-sm font-medium text-on-surface">
                  Assignment Type
                </label>
                <select
                  id="assign-type"
                  {...register("assignmentType")}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary",
                    errors.assignmentType ? "border-danger" : "border-grey-300",
                  )}
                >
                  <option value="">Select type</option>
                  {ASSIGNMENT_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.assignmentType && (
                  <p className="text-xs text-danger">{errors.assignmentType.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="assign-area" className="text-sm font-medium text-on-surface">
                  Select Area
                </label>
                <select
                  id="assign-area"
                  {...register("area")}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary",
                    errors.area ? "border-danger" : "border-grey-300",
                  )}
                >
                  <option value="">Select area</option>
                  {AREA_OPTIONS.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
                {errors.area && (
                  <p className="text-xs text-danger">{errors.area.message}</p>
                )}
              </div>
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

            {/* Row 6: Duration type + count (shown when Assignment Type is "Periodical Task") */}
            {isPeriodical && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="assign-duration-type" className="text-sm font-medium text-on-surface">
                    Duration Type
                  </label>
                  <select
                    id="assign-duration-type"
                    {...register("durationType")}
                    className="rounded-xl border border-grey-300 px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="assign-duration-count" className="text-sm font-medium text-on-surface">
                    Duration count
                  </label>
                  <Controller
                    name="durationCount"
                    control={control}
                    render={({ field }) => (
                      <input
                        id="assign-duration-count"
                        type="number"
                        min="1"
                        placeholder="1"
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                        className="rounded-xl border border-grey-300 px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    )}
                  />
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
                  {CLEANERS.length} available
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

              {/* Select All */}
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
                <span className="text-xs text-grey-500 select-none cursor-pointer">
                  Select All
                </span>
              </div>

              {/* Cleaner grid */}
              <div className="grid grid-cols-2 gap-2">
                {filteredCleaners.map((cleaner) => {
                  const isSelected = selectedCleaners?.includes(cleaner.id) ?? false;
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
                      {/* Avatar with online dot */}
                      <div className="relative shrink-0">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold text-white"
                          style={{
                            background: `linear-gradient(135deg, ${cleaner.gradientFrom}, ${cleaner.gradientTo})`,
                          }}
                          aria-hidden="true"
                        >
                          {cleaner.initials}
                        </div>
                        <span
                          className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-success"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-on-surface">
                          {cleaner.name}
                        </p>
                        <p className="text-xs text-grey-500">
                          {cleaner.site} · {cleaner.tasks} tasks
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-4">
            <button
              type="submit"
              className="h-11 w-full rounded-xl bg-primary text-sm font-medium text-white transition-colors hover:bg-primary-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Create Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
