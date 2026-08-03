"use client";

import {
  useForm,
  useFormContext,
  useFieldArray,
  useWatch,
  Controller,
  FormProvider,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Search, Check, Plus, Trash2, Clock, MapPin } from "lucide-react";
import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { SearchableSelect, type SelectOption } from "@/features/user-management/components/SearchableSelect";
import { WorkingDaysSelector } from "@/features/user-management/components/WorkingDaysSelector";
import { useSites } from "@/features/user-management/hooks/useSites";
import { useFloors, useCreateFloor } from "@/features/user-management/hooks/useFloors";
import { useAreas, useCreateArea } from "@/features/user-management/hooks/useAreas";
import { NameFormModal } from "@/components/admin/NameFormModal";
import { useSiteCleaners, useSiteSupervisors } from "@/features/user-management/hooks/useSiteAssignments";
import { useCreateAssignment } from "@/features/workforce/hooks/useAssignments";
import { useSaveDraft, useDeleteDraft } from "@/features/workforce/hooks/useDrafts";
import { useInventoryItems } from "@/features/inventory/hooks/useInventory";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import type { Cleaner } from "@/features/cleaners/schemas/cleaner.schema";
import {
  AssignmentFormSchema,
  WORK_TYPE_LABELS,
  RECURRENCE_TYPE_LABELS,
  WEEK_OF_MONTH_OPTIONS,
  computeExpectedEndTime,
  allTasksOf,
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
  /** Prefill the site + first group's floor/area (used by the scope view "+" cells). */
  defaultSiteId?: string;
  defaultFloorId?: string;
  defaultAreaId?: string;
  /** When set, load this draft's saved form state instead of a blank form. */
  loadedDraft?: { id: string; payload: unknown } | null;
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

function emptyGroup(floorId = "", areaId = "") {
  return { floorId, areaId, tasks: [] as AssignmentFormInput["groups"][number]["tasks"] };
}

interface Prefill {
  defaultDate?: Date;
  defaultTime?: string;
  defaultSiteId?: string;
  defaultFloorId?: string;
  defaultAreaId?: string;
}

function buildDefaults({
  defaultDate,
  defaultTime = "",
  defaultSiteId = "",
  defaultFloorId = "",
  defaultAreaId = "",
}: Prefill): AssignmentFormInput {
  return {
    workType: "GENERAL_TASK",
    siteId: defaultSiteId,
    date: defaultDate ? formatDateForInput(defaultDate) : "",
    startTime: defaultTime,
    groups: [emptyGroup(defaultFloorId, defaultAreaId)],
    cleanerIds: [],
    supervisorIds: [],
    assignPerTask: false,
    recurrenceType: "DAILY",
    recurrenceCount: 1,
    daysOfWeek: [],
    monthlyMode: "DAY_OF_MONTH",
    dayOfMonth: undefined,
    weekOfMonth: undefined,
    monthlyWeekday: undefined,
    otherRepeatWorkingDays: false,
    otherUseRecurrence: false,
  };
}

const inputClass =
  "rounded-xl border px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary";

function formatDuration(minutes?: number): string {
  if (minutes == null) return "—";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ── Per-task expected inventory items (optional) ──────────────────────────────

interface TaskItemsEditorProps {
  groupIndex: number;
  taskIndex: number;
}

function TaskItemsEditor({ groupIndex, taskIndex }: TaskItemsEditorProps) {
  const { control } = useFormContext<AssignmentFormInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `groups.${groupIndex}.tasks.${taskIndex}.items`,
  });
  const itemsQuery = useInventoryItems(true);
  const values = useWatch({ control, name: `groups.${groupIndex}.tasks.${taskIndex}.items` }) ?? [];

  const [expanded, setExpanded] = useState(false);
  const [selItem, setSelItem] = useState<string | null>(null);
  const [qty, setQty] = useState("1");

  const catalog = itemsQuery.data ?? [];
  const chosenIds = values.map((v) => v?.itemId);
  const options: SelectOption[] = catalog
    .filter((it) => !chosenIds.includes(it.id))
    .map((it) => ({ value: it.id, label: `${it.name} (${it.unit})` }));

  const itemById = (id: string) => catalog.find((it) => it.id === id);

  function addItem() {
    if (!selItem) return;
    const q = parseFloat(qty);
    if (!Number.isFinite(q) || q <= 0) return;
    append({ itemId: selItem, quantity: q });
    setSelItem(null);
    setQty("1");
  }

  const showList = fields.length > 0;

  if (!expanded && !showList) {
    return (
      <div className="mt-2 pl-7">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="inline-flex items-center gap-1 rounded-lg border border-dashed border-grey-300 px-2.5 py-1 text-[11px] font-medium text-grey-600 transition-colors hover:border-primary hover:text-primary"
        >
          <Plus size={12} aria-hidden="true" />
          Add items
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 pl-7">
      <p className="mb-1.5 text-[11px] font-medium text-grey-500">Expected items (optional)</p>

      {showList && (
        <ul className="mb-2 flex flex-col gap-1">
          {fields.map((field, i) => {
            const value = values[i];
            const item = value?.itemId ? itemById(value.itemId) : undefined;
            return (
              <li
                key={field.id}
                className="flex items-center gap-2 rounded-lg border border-grey-200 bg-white px-2.5 py-1.5 text-[11px]"
              >
                <span className="min-w-0 flex-1 truncate text-on-surface">
                  {item?.name ?? "Item"}
                </span>
                <span className="shrink-0 rounded-md bg-grey-100 px-1.5 py-0.5 font-medium text-grey-600">
                  {value?.quantity} {item?.unit ?? ""}
                </span>
                <button
                  type="button"
                  aria-label="Remove item"
                  onClick={() => remove(i)}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-red-50 hover:text-danger"
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <SearchableSelect
            label="Item"
            options={options}
            value={selItem}
            onChange={setSelItem}
            loading={itemsQuery.isLoading}
            placeholder="Select an item"
            emptyMessage="No items available"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-on-surface">Quantity</label>
          <div className="flex items-stretch gap-1.5">
            <input
              type="number"
              min="0.001"
              step="any"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              aria-label="Expected quantity"
              className={cn("w-full bg-white sm:w-20", inputClass, "border-grey-300")}
            />
            <span
              aria-label="Quantity unit"
              className="flex min-w-[3.25rem] shrink-0 items-center justify-center rounded-xl border border-grey-200 bg-grey-100 px-2 text-xs font-medium text-grey-600"
            >
              {(selItem && itemById(selItem)?.unit) || "unit"}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={addItem}
          disabled={!selItem}
          className="flex h-[38px] shrink-0 items-center justify-center gap-1 rounded-xl bg-primary px-3 text-[13px] font-medium text-white transition-colors hover:bg-primary-variant disabled:opacity-50"
        >
          <Plus size={14} aria-hidden="true" />
          Add
        </button>
      </div>
    </div>
  );
}

// ── Location group card: floor + area, then quick-add many tasks ──────────────

interface LocationGroupCardProps {
  groupIndex: number;
  siteId: string;
  floorOptions: SelectOption[];
  floorsLoading: boolean;
  canRemove: boolean;
  onRemove: () => void;
  assignPerTask: boolean;
  cleaners: Cleaner[];
}

function LocationGroupCard({
  groupIndex,
  siteId,
  floorOptions,
  floorsLoading,
  canRemove,
  onRemove,
  assignPerTask,
  cleaners,
}: LocationGroupCardProps) {
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<AssignmentFormInput>();

  const floorId = watch(`groups.${groupIndex}.floorId`);
  const areasQuery = useAreas(floorId || undefined);
  const { fields, append, remove } = useFieldArray({
    control,
    name: `groups.${groupIndex}.tasks`,
  });

  const [floorPromptOpen, setFloorPromptOpen] = useState(false);
  const [areaPromptOpen, setAreaPromptOpen] = useState(false);
  const createFloor = useCreateFloor();
  const createArea = useCreateArea();

  const [qName, setQName] = useState("");
  const [qDuration, setQDuration] = useState("");
  const [qDesc, setQDesc] = useState("");
  const [qError, setQError] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const areaOptions: SelectOption[] = useMemo(
    () => (areasQuery.data ?? []).map((a) => ({ value: a.id, label: a.name })),
    [areasQuery.data],
  );

  const groupErrors = errors.groups?.[groupIndex];

  function addTask() {
    const name = qName.trim();
    if (name.length < 2) {
      setQError(true);
      nameRef.current?.focus();
      return;
    }
    const duration = qDuration ? parseInt(qDuration, 10) : undefined;
    append({
      name,
      durationMinutes: duration && duration > 0 ? duration : undefined,
      description: qDesc.trim(),
      cleanerIds: [],
      items: [],
    });
    setQName("");
    setQDuration("");
    setQDesc("");
    setQError(false);
    nameRef.current?.focus();
  }

  function onQuickKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTask();
    }
  }

  function toggleTaskCleaner(taskIndex: number, cleanerId: string) {
    const current = watch(`groups.${groupIndex}.tasks.${taskIndex}.cleanerIds`) ?? [];
    const next = current.includes(cleanerId)
      ? current.filter((c) => c !== cleanerId)
      : [...current, cleanerId];
    setValue(`groups.${groupIndex}.tasks.${taskIndex}.cleanerIds`, next, { shouldValidate: true });
  }

  return (
    <div className="rounded-2xl border border-grey-200 bg-white/70 p-4">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <MapPin size={13} aria-hidden="true" />
        </span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
          {fields.length} task{fields.length === 1 ? "" : "s"}
        </span>
        {canRemove && (
          <button
            type="button"
            aria-label={`Remove location ${groupIndex + 1}`}
            onClick={onRemove}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-red-50 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Floor + Area */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <Controller
              name={`groups.${groupIndex}.floorId`}
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  label="Floor"
                  options={floorOptions}
                  value={field.value || null}
                  onChange={(v) => {
                    field.onChange(v);
                    setValue(`groups.${groupIndex}.areaId`, "");
                  }}
                  disabled={!siteId}
                  loading={floorsLoading && !!siteId}
                  error={groupErrors?.floorId?.message}
                  placeholder={siteId ? "Select floor" : "Select a site first"}
                  emptyMessage="No floors for this site"
                />
              )}
            />
          </div>
          <button
            type="button"
            aria-label="Add a new floor"
            title="Add a new floor"
            disabled={!siteId}
            onClick={() => setFloorPromptOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-dashed border-primary text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <Controller
              name={`groups.${groupIndex}.areaId`}
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  label="Area"
                  options={areaOptions}
                  value={field.value || null}
                  onChange={(v) => field.onChange(v)}
                  disabled={!floorId}
                  loading={areasQuery.isLoading && !!floorId}
                  error={groupErrors?.areaId?.message}
                  placeholder={floorId ? "Select area" : "Select a floor first"}
                  emptyMessage="No areas for this floor"
                />
              )}
            />
          </div>
          <button
            type="button"
            aria-label="Add a new area"
            title="Add a new area"
            disabled={!floorId}
            onClick={() => setAreaPromptOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-dashed border-primary text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Add floor / area prompts */}
      <NameFormModal
        open={floorPromptOpen}
        title="Add floor"
        description="New floor for this site."
        label="Floor name"
        submitLabel="Add floor"
        isPending={createFloor.isPending}
        error={createFloor.isError ? getErrorMessage(createFloor.error) : undefined}
        onSubmit={(name) => {
          if (!siteId) return;
          createFloor.mutate(
            { siteId, input: { name } },
            {
              onSuccess: (floor) => {
                setValue(`groups.${groupIndex}.floorId`, floor.id, { shouldValidate: true });
                setValue(`groups.${groupIndex}.areaId`, "");
                setFloorPromptOpen(false);
                createFloor.reset();
              },
            },
          );
        }}
        onClose={() => {
          setFloorPromptOpen(false);
          createFloor.reset();
        }}
      />
      <NameFormModal
        open={areaPromptOpen}
        title="Add area"
        description="New area for the selected floor."
        label="Area name"
        submitLabel="Add area"
        isPending={createArea.isPending}
        error={createArea.isError ? getErrorMessage(createArea.error) : undefined}
        onSubmit={(name) => {
          if (!floorId) return;
          createArea.mutate(
            { floorId, input: { name } },
            {
              onSuccess: (area) => {
                setValue(`groups.${groupIndex}.areaId`, area.id, { shouldValidate: true });
                setAreaPromptOpen(false);
                createArea.reset();
              },
            },
          );
        }}
        onClose={() => {
          setAreaPromptOpen(false);
          createArea.reset();
        }}
      />

      {/* Quick add — sits directly under floor/area so it never moves out of reach */}
      <div className="mt-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="flex-1">
            <input
              ref={nameRef}
              type="text"
              value={qName}
              onChange={(e) => {
                setQName(e.target.value);
                if (qError) setQError(false);
              }}
              onKeyDown={onQuickKeyDown}
              placeholder="Task name — e.g. Vacuum & mop floor"
              aria-label="New task name"
              className={cn(
                "w-full bg-white",
                inputClass,
                qError ? "border-danger" : "border-grey-300",
              )}
            />
          </div>
          <input
            type="number"
            min="5"
            step="5"
            value={qDuration}
            onChange={(e) => setQDuration(e.target.value)}
            onKeyDown={onQuickKeyDown}
            placeholder="Mins"
            aria-label="Estimated duration in minutes (optional)"
            className={cn("w-full bg-white sm:w-24", inputClass, "border-grey-300")}
          />
          <button
            type="button"
            onClick={addTask}
            className="flex h-[38px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Plus size={15} aria-hidden="true" />
            Add
          </button>
        </div>
        <input
          type="text"
          value={qDesc}
          onChange={(e) => setQDesc(e.target.value)}
          onKeyDown={onQuickKeyDown}
          placeholder="Description (optional)"
          aria-label="Task description (optional)"
          className={cn("mt-2 w-full bg-white", inputClass, "border-grey-300")}
        />
        <p className="mt-1.5 text-[11px] text-grey-500">
          Duration &amp; description are optional. Press <kbd className="rounded bg-white px-1">Enter</kbd> to
          add and keep going.
        </p>
      </div>

      {/* Added tasks */}
      {fields.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1.5">
          {fields.map((field, taskIndex) => {
            const task = watch(`groups.${groupIndex}.tasks.${taskIndex}`);
            const selected = task?.cleanerIds ?? [];
            const taskCleanerError =
              groupErrors?.tasks?.[taskIndex]?.cleanerIds?.message;
            return (
              <li
                key={field.id}
                className="rounded-xl border border-grey-200 bg-white px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[11px] font-semibold text-primary">
                    {taskIndex + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-on-surface" title={task?.name}>
                    {task?.name}
                  </span>
                  <span className="shrink-0 rounded-md bg-grey-100 px-1.5 py-0.5 text-[11px] font-medium text-grey-500">
                    {formatDuration(task?.durationMinutes ?? undefined)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove task ${task?.name}`}
                    onClick={() => remove(taskIndex)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-red-50 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <X size={13} aria-hidden="true" />
                  </button>
                </div>
                {task?.description && (
                  <p className="mt-0.5 pl-7 text-xs text-grey-500">{task.description}</p>
                )}

                {assignPerTask && (
                  <div className="mt-2 pl-7">
                    {cleaners.length === 0 ? (
                      <p className="text-[11px] text-grey-500">No cleaners on this site.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {cleaners.map((cleaner) => {
                          const isSelected = selected.includes(cleaner.id);
                          return (
                            <button
                              key={cleaner.id}
                              type="button"
                              onClick={() => toggleTaskCleaner(taskIndex, cleaner.id)}
                              aria-pressed={isSelected}
                              className={cn(
                                "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                isSelected
                                  ? "border-primary bg-primary text-white"
                                  : "border-grey-300 bg-white text-on-surface hover:border-primary",
                              )}
                            >
                              {isSelected && <Check size={10} aria-hidden="true" />}
                              {cleanerName(cleaner)}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {taskCleanerError && (
                      <p className="mt-1 text-[11px] text-danger">{taskCleanerError}</p>
                    )}
                  </div>
                )}

                <TaskItemsEditor groupIndex={groupIndex} taskIndex={taskIndex} />
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-grey-500">
          No tasks yet — add one above. Great for many tasks on the same floor &amp; area.
        </p>
      )}
      {groupErrors?.tasks?.message && (
        <p className="mt-2 text-xs text-danger">{groupErrors.tasks.message}</p>
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
  defaultSiteId,
  defaultFloorId,
  defaultAreaId,
  loadedDraft,
}: NewAssignmentModalProps) {
  const [cleanerSearch, setCleanerSearch] = useState("");
  const [activeDraftId, setActiveDraftId] = useState<string | undefined>();
  const [showClosePrompt, setShowClosePrompt] = useState(false);

  const sitesQuery = useSites();
  const createMutation = useCreateAssignment();
  const saveDraftMutation = useSaveDraft();
  const deleteDraftMutation = useDeleteDraft();

  const methods = useForm<AssignmentFormInput>({
    resolver: zodResolver(AssignmentFormSchema),
    defaultValues: buildDefaults({ defaultDate, defaultTime, defaultSiteId, defaultFloorId, defaultAreaId }),
  });
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors, isDirty },
  } = methods;

  const { fields: groupFields, append: appendGroup, remove: removeGroup } = useFieldArray({
    control,
    name: "groups",
  });

  const workType = watch("workType");
  const siteId = watch("siteId");
  const startTime = watch("startTime");
  const groups = watch("groups");
  const selectedCleaners = watch("cleanerIds");
  const selectedSupervisors = watch("supervisorIds");
  const assignPerTask = watch("assignPerTask");
  const recurrenceType = watch("recurrenceType");
  const monthlyMode = watch("monthlyMode");
  const otherRepeatWorkingDays = watch("otherRepeatWorkingDays");
  const otherUseRecurrence = watch("otherUseRecurrence");

  const showWorkingDays =
    workType === "GENERAL_TASK" || (workType === "OTHER" && otherRepeatWorkingDays);
  const showRecurrence =
    workType === "PERIODICAL_TASK" || (workType === "OTHER" && otherUseRecurrence);

  const floorsQuery = useFloors(siteId || undefined);
  // Only cleaners assigned to the selected site can be picked.
  const cleanersQuery = useSiteCleaners(siteId || undefined);
  // Only supervisors assigned to the selected site can be picked.
  const supervisorsQuery = useSiteSupervisors(siteId || undefined);

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

  const allTasks = useMemo(() => allTasksOf({ groups: groups ?? [] }), [groups]);
  const totalTasks = allTasks.length;
  const expectedEndTime = useMemo(
    () => computeExpectedEndTime(startTime, allTasks),
    [startTime, allTasks],
  );

  const cleaners = cleanersQuery.data ?? [];
  const filteredCleaners = cleaners.filter((c) =>
    cleanerName(c).toLowerCase().includes(cleanerSearch.toLowerCase()),
  );
  const allFilteredSelected =
    filteredCleaners.length > 0 && filteredCleaners.every((c) => selectedCleaners?.includes(c.id));

  const supervisors = supervisorsQuery.data ?? [];
  // Default supervisor selection to the site's assigned supervisors once they load.
  const didDefaultSupervisors = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!siteId || supervisorsQuery.isLoading) return;
    // Only auto-select once per site, and only when nothing is chosen yet.
    if (didDefaultSupervisors.current === siteId) return;
    didDefaultSupervisors.current = siteId;
    if ((getValues("supervisorIds") ?? []).length === 0) {
      setValue("supervisorIds", supervisors.map((s) => s.id), { shouldValidate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, supervisorsQuery.isLoading, supervisorsQuery.data]);

  useEffect(() => {
    if (open) {
      if (loadedDraft?.payload) {
        // Merge over defaults so any newly-added form fields are still present.
        const base = buildDefaults({});
        reset({ ...base, ...(loadedDraft.payload as Partial<AssignmentFormInput>) } as AssignmentFormInput);
        setActiveDraftId(loadedDraft.id);
      } else {
        reset(buildDefaults({ defaultDate, defaultTime, defaultSiteId, defaultFloorId, defaultAreaId }));
        setActiveDraftId(undefined);
      }
      setCleanerSearch("");
      setShowClosePrompt(false);
      createMutation.reset();
      saveDraftMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultDate, defaultTime, defaultSiteId, defaultFloorId, defaultAreaId, loadedDraft, reset]);

  // Close directly when there's nothing to lose; otherwise offer to save a draft.
  const handleClose = useCallback(() => {
    if (isDirty && !createMutation.isPending && !saveDraftMutation.isPending) {
      setShowClosePrompt(true);
      return;
    }
    onClose();
  }, [isDirty, createMutation.isPending, saveDraftMutation.isPending, onClose]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    if (open) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]);

  function draftTitle(values: AssignmentFormInput): string {
    const site = (sitesQuery.data ?? []).find((s) => s.id === values.siteId);
    const count = allTasksOf({ groups: values.groups ?? [] }).length;
    return [
      WORK_TYPE_LABELS[values.workType],
      site?.name ?? "No site",
      `${count} task${count === 1 ? "" : "s"}`,
    ].join(" · ");
  }

  function saveDraftNow(closeAfter: boolean) {
    const values = getValues();
    saveDraftMutation.mutate(
      {
        id: activeDraftId,
        input: {
          title: draftTitle(values),
          siteId: values.siteId || undefined,
          payload: values,
        },
      },
      {
        onSuccess: (saved) => {
          setActiveDraftId(saved.id);
          if (closeAfter) {
            setShowClosePrompt(false);
            onClose();
          }
        },
      },
    );
  }

  function handleFormSubmit(data: AssignmentFormInput) {
    createMutation.mutate(data, {
      onSuccess: () => {
        // A draft that has become a real assignment no longer needs to linger.
        if (activeDraftId) deleteDraftMutation.mutate(activeDraftId);
        onCreated?.();
        onClose();
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

  function toggleSupervisor(id: string) {
    const current = selectedSupervisors ?? [];
    if (current.includes(id)) {
      setValue("supervisorIds", current.filter((s) => s !== id), { shouldValidate: true });
    } else {
      setValue("supervisorIds", [...current, id], { shouldValidate: true });
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
            <div className="max-h-[72vh] overflow-y-auto px-6 pb-2">
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
                        // Floors/areas/cleaners are site-specific — reset to one blank group.
                        setValue("cleanerIds", []);
                        setValue("supervisorIds", []);
                        didDefaultSupervisors.current = undefined;
                        setValue("groups", [emptyGroup()], { shouldValidate: false });
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
                  <p className="mb-2 text-sm font-medium text-on-surface">Site working days</p>
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
                      This site has no working days configured — tasks will repeat every day. Set
                      working days in Site Management first if that is not intended.
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
                    <div className="mt-3">
                      {/* Mode toggle: on a date vs on an ordinal weekday */}
                      <div className="mb-3 inline-flex overflow-hidden rounded-xl border border-grey-300">
                        {(
                          [
                            ["DAY_OF_MONTH", "On a date"],
                            ["DAY_OF_WEEK", "On a weekday"],
                          ] as const
                        ).map(([mode, label]) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setValue("monthlyMode", mode, { shouldValidate: true })}
                            className={cn(
                              "px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                              monthlyMode === mode
                                ? "bg-primary text-white"
                                : "bg-white text-on-surface hover:bg-grey-100",
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {monthlyMode === "DAY_OF_MONTH" ? (
                        <div className="flex flex-col gap-1.5">
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
                      ) : (
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium text-on-surface">
                            On the…
                          </label>
                          {/* Ordinal 1st–4th */}
                          <Controller
                            name="weekOfMonth"
                            control={control}
                            render={({ field }) => (
                              <div className="flex gap-1.5">
                                {WEEK_OF_MONTH_OPTIONS.map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => field.onChange(opt.value)}
                                    aria-pressed={field.value === opt.value}
                                    className={cn(
                                      "h-9 w-11 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                      field.value === opt.value
                                        ? "bg-primary text-white"
                                        : "bg-white text-on-surface ring-1 ring-grey-300 hover:bg-grey-100",
                                    )}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          />
                          {errors.weekOfMonth && (
                            <p className="text-xs text-danger">{errors.weekOfMonth.message}</p>
                          )}
                          {/* Weekday circles (single-select) */}
                          <Controller
                            name="monthlyWeekday"
                            control={control}
                            render={({ field }) => (
                              <WorkingDaysSelector
                                value={field.value ? [field.value] : []}
                                singleSelect
                                onChange={(days) => field.onChange(days[0])}
                                error={errors.monthlyWeekday?.message}
                              />
                            )}
                          />
                          <p className="text-xs text-grey-500">
                            e.g. the 2nd Wednesday of every{" "}
                            {recurrenceType === "MONTHLY" ? "month" : "period"}.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tasks — grouped by floor & area */}
              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-sm font-medium text-on-surface">Tasks by location</span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {totalTasks} total
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {groupFields.map((field, index) => (
                    <LocationGroupCard
                      key={field.id}
                      groupIndex={index}
                      siteId={siteId}
                      floorOptions={floorOptions}
                      floorsLoading={floorsQuery.isLoading}
                      canRemove={groupFields.length > 1}
                      onRemove={() => removeGroup(index)}
                      assignPerTask={assignPerTask}
                      cleaners={cleaners}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => appendGroup(emptyGroup())}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-grey-300 py-2.5 text-sm font-medium text-grey-500 transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Plus size={15} aria-hidden="true" />
                  Add another floor / area
                </button>

                {typeof errors.groups?.message === "string" && (
                  <p className="mt-2 text-xs text-danger">{errors.groups.message}</p>
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
                  <span className="ml-auto text-xs text-grey-500">start + total task durations</span>
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

                {totalTasks > 1 && (
                  <label className="mb-3 flex items-center gap-2 text-sm text-on-surface">
                    <input
                      type="checkbox"
                      {...register("assignPerTask")}
                      className="h-4 w-4 rounded border-grey-300 accent-[#0B585A]"
                    />
                    Assign cleaners per task (otherwise the selection below applies to all{" "}
                    {totalTasks} tasks)
                  </label>
                )}

                {assignPerTask ? (
                  <p className="text-xs text-grey-500">
                    Pick cleaners on each task in the location cards above.
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
                      <p className="text-xs text-grey-500">No cleaners are assigned to this site.</p>
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

              {/* Supervisor assignment — reviewers of these tasks */}
              <div className="mt-6">
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-sm font-medium text-on-surface">Assign Supervisors</span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {!siteId
                      ? "Select a site"
                      : supervisorsQuery.isLoading
                        ? "Loading…"
                        : `${supervisors.length} available`}
                  </span>
                </div>
                <p className="mb-3 text-xs text-grey-500">
                  Selected supervisors will see these tasks to review. Site supervisors are selected
                  by default.
                </p>

                {!siteId ? (
                  <p className="text-xs text-grey-500">
                    Select a site to see its assigned supervisors.
                  </p>
                ) : supervisorsQuery.isLoading ? (
                  <p className="text-xs text-grey-500">Loading supervisors…</p>
                ) : supervisors.length === 0 ? (
                  <p className="text-xs text-grey-500">No supervisors are assigned to this site.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {supervisors.map((sup, i) => {
                      const isSelected = selectedSupervisors?.includes(sup.id) ?? false;
                      const gradient = CLEANER_GRADIENTS[i % CLEANER_GRADIENTS.length]!;
                      return (
                        <button
                          key={sup.id}
                          type="button"
                          onClick={() => toggleSupervisor(sup.id)}
                          aria-pressed={isSelected}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                            isSelected
                              ? "border-primary bg-primary/5 ring-2 ring-primary"
                              : "border-white/30 bg-white/60 hover:border-grey-300",
                          )}
                        >
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white"
                            style={{
                              background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
                            }}
                            aria-hidden="true"
                          >
                            {cleanerInitials(sup)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-on-surface">
                              {cleanerName(sup)}
                            </p>
                            {sup.email && (
                              <p className="truncate text-xs text-grey-500">{sup.email}</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-4">
              {activeDraftId && (
                <p className="mb-2 text-xs text-grey-500">Editing a saved draft.</p>
              )}
              {createMutation.isError && (
                <p className="mb-3 text-sm text-danger">{getErrorMessage(createMutation.error)}</p>
              )}
              {saveDraftMutation.isError && (
                <p className="mb-3 text-sm text-danger">{getErrorMessage(saveDraftMutation.error)}</p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => saveDraftNow(false)}
                  disabled={saveDraftMutation.isPending || createMutation.isPending}
                  className="h-11 shrink-0 rounded-xl border border-primary px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saveDraftMutation.isPending
                    ? "Saving…"
                    : saveDraftMutation.isSuccess && !isDirty
                      ? "Draft saved"
                      : activeDraftId
                        ? "Update draft"
                        : "Save as draft"}
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="h-11 flex-1 rounded-xl bg-primary text-sm font-medium text-white transition-colors hover:bg-primary-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {createMutation.isPending
                    ? "Creating…"
                    : `Create Assignment${totalTasks > 0 ? ` (${totalTasks} task${totalTasks === 1 ? "" : "s"})` : ""}`}
                </button>
              </div>
            </div>
          </form>
        </FormProvider>

        {/* Close-with-unsaved-changes prompt */}
        {showClosePrompt && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-surface p-5 shadow-2xl ring-1 ring-grey-200">
              <h3 className="text-base font-semibold text-on-surface">Save as draft?</h3>
              <p className="mt-1.5 text-sm text-grey-500">
                You have unsaved changes. Save them as a draft to finish later, or discard.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => saveDraftNow(true)}
                  disabled={saveDraftMutation.isPending}
                  className="h-10 w-full rounded-xl bg-primary text-sm font-medium text-white transition-colors hover:bg-primary-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
                >
                  {saveDraftMutation.isPending ? "Saving…" : "Save as draft"}
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowClosePrompt(false)}
                    className="h-10 flex-1 rounded-xl border border-grey-300 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Keep editing
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowClosePrompt(false);
                      onClose();
                    }}
                    className="h-10 flex-1 rounded-xl border border-grey-300 text-sm font-medium text-danger transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Discard
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
