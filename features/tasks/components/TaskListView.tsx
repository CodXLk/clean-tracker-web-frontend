"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Check,
  ChevronDown,
  Flag,
  ImagePlus,
  Info,
  Layers,
  Square,
  SquareCheck,
  X,
} from "lucide-react";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import { useCompleteTasks, useDraftPhotos, useSaveDraftPhotos, useDeleteDraftPhoto } from "@/features/tasks/hooks/useTasks";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { PRIORITY_META } from "@/features/workforce/components/PriorityFlagMenu";
import { TaskInfoPopup } from "@/features/tasks/components/TaskInfoPopup";
import { assignmentTypeColor, assignmentTypeLabel } from "@/features/tasks/lib/task-utils";
import type { TaskOccurrence } from "@/features/tasks/schemas/task.schema";
import { cn } from "@/lib/utils/cn";

/** Stable selection key: redos are keyed by their redoId, regular tasks by taskId. */
function occKey(task: TaskOccurrence): string {
  return task.redoId ?? (task.taskId as string);
}

/** "Done" means completed for a cleaner, or inspected for a supervisor inspection. */
function isDone(task: TaskOccurrence, inspect: boolean): boolean {
  return inspect ? !!task.inspected : task.status === "COMPLETED";
}

const RATINGS = Array.from({ length: 10 }, (_, i) => i + 1);

interface AreaGroup {
  areaId: string;
  areaName: string;
  /** Display tasks (a group collapses identical per-area copies into one). */
  tasks: TaskOccurrence[];
  /** Every underlying occurrence (all member areas) — used for cross-area completion. */
  allTasks: TaskOccurrence[];
  /** Set when this row represents an area group. */
  areaGroupId?: string;
  /** The area's parent group (expandGroups mode nests areas under their group). */
  parentGroupId?: string;
  parentGroupName?: string;
}

interface TaskListViewProps {
  occurrences: TaskOccurrence[];
  selectedFloor: string | null;
  /** Cleaners checked in to the site may select and complete; otherwise the list is read-only. */
  canComplete: boolean;
  /** Cleaner mode: collapse a floor's area groups into one row and complete across all member areas. */
  groupAreas?: boolean;
  /** Supervisor mode: keep areas separate but nest them under a group heading (group → area → tasks). */
  expandGroups?: boolean;
  /** Supervisor inspection mode: inline select + rate/complaint/complete (mirrors cleaner completion). */
  inspectMode?: boolean;
  /** Submit an inspection for the selected occurrences (rating optional). */
  onInspectSubmit?: (
    occurrences: { taskId: string; date: string }[],
    rating: number | undefined,
    onDone: () => void,
  ) => void;
  /** Raise a complaint for the selected occurrences with a note + photos. */
  onInspectComplaint?: (
    occurrences: { taskId: string; date: string }[],
    note: string,
    photos: File[],
    onDone: () => void,
  ) => void;
  inspectPending?: boolean;
}

/** Floor-grouped list of areas with their tasks as a nested sub-list, with area-wise and
 *  individual task completion for cleaners. */
export function TaskListView({
  occurrences,
  selectedFloor,
  canComplete,
  groupAreas = false,
  expandGroups = false,
  inspectMode = false,
  onInspectSubmit,
  onInspectComplaint,
  inspectPending = false,
}: TaskListViewProps) {
  const completeTasks = useCompleteTasks();
  const saveDraftPhotos = useSaveDraftPhotos();
  const deleteDraftPhoto = useDeleteDraftPhoto();
  // Checkbox selection is available for cleaner completion or supervisor inspection.
  const selecting = canComplete || inspectMode;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Membership = expanded; areas start collapsed by default.
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  // Inspection-mode panel state (rating optional; photos are complaint evidence).
  const [rating, setRating] = useState<number | null>(null);
  const [inspectPhotos, setInspectPhotos] = useState<File[]>([]);
  // Task whose details popup is open (info icon).
  const [infoTask, setInfoTask] = useState<TaskOccurrence | null>(null);

  const beforeCameraInputRef = useRef<HTMLInputElement>(null);
  const beforeGalleryInputRef = useRef<HTMLInputElement>(null);
  const afterCameraInputRef = useRef<HTMLInputElement>(null);
  const afterGalleryInputRef = useRef<HTMLInputElement>(null);
  const inspectPhotoInputRef = useRef<HTMLInputElement>(null);

  const inspectPreviews = useMemo(() => inspectPhotos.map((f) => URL.createObjectURL(f)), [inspectPhotos]);
  useEffect(() => {
    return () => inspectPreviews.forEach((url) => URL.revokeObjectURL(url));
  }, [inspectPreviews]);

  const areaGroups = useMemo<AreaGroup[]>(() => {
    const map = new Map<string, AreaGroup>();
    for (const o of occurrences) {
      if (o.floorName !== selectedFloor || !o.areaId || !o.areaName) continue;
      // Cleaners see a group's areas as one row; others stay area-wise.
      const grouped = groupAreas && !!o.areaGroupId && !!o.areaGroupName;
      const key = grouped ? o.areaGroupId! : o.areaId;
      const name = grouped ? o.areaGroupName! : o.areaName;
      const group = map.get(key) ?? {
        areaId: key,
        areaName: name,
        tasks: [],
        allTasks: [],
        areaGroupId: grouped ? o.areaGroupId! : undefined,
        parentGroupId: o.areaGroupId ?? undefined,
        parentGroupName: o.areaGroupName ?? undefined,
      };
      group.allTasks.push(o);
      map.set(key, group);
    }
    for (const group of map.values()) {
      if (group.areaGroupId) {
        // Collapse a group task's per-area copies into one row. Older tasks may lack a
        // groupTaskKey, so fall back to the (shared) task name within the group.
        const byKey = new Map<string, TaskOccurrence[]>();
        for (const o of group.allTasks) {
          const k = o.groupTaskKey ?? o.name ?? o.taskId ?? "";
          const list = byKey.get(k) ?? [];
          list.push(o);
          byKey.set(k, list);
        }
        group.tasks = Array.from(byKey.values()).map((list) => {
          const allDone = list.every((o) => o.status === "COMPLETED");
          // Represent the row with a still-pending copy (if any) so it stays selectable.
          const rep = list.find((o) => o.status !== "COMPLETED") ?? list[0]!;
          return { ...rep, status: allDone ? ("COMPLETED" as const) : rep.status };
        });
      } else {
        group.tasks = group.allTasks;
      }
      // Not-done tasks first within each area (stable); done ones pushed to the bottom.
      group.tasks.sort(
        (a, b) => (isDone(a, inspectMode) ? 1 : 0) - (isDone(b, inspectMode) ? 1 : 0),
      );
    }
    // Areas with pending work rise to the top; fully-done areas sink to the bottom (stable).
    const groups = Array.from(map.values());
    groups.sort((a, b) => {
      const aDone = a.tasks.length > 0 && a.tasks.every((t) => isDone(t, inspectMode));
      const bDone = b.tasks.length > 0 && b.tasks.every((t) => isDone(t, inspectMode));
      return (aDone ? 1 : 0) - (bDone ? 1 : 0);
    });
    return groups;
  }, [occurrences, selectedFloor, groupAreas, inspectMode]);

  // Render order: in expandGroups mode, cluster a group's areas under one heading (group →
  // indented area → tasks); otherwise a flat list of area sections.
  type RenderItem =
    | { kind: "header"; id: string; name: string }
    | { kind: "area"; group: AreaGroup; indented: boolean };
  const renderItems = useMemo<RenderItem[]>(() => {
    if (!expandGroups) {
      return areaGroups.map((group) => ({ kind: "area", group, indented: false }));
    }
    const items: RenderItem[] = [];
    const emitted = new Set<string>();
    for (const group of areaGroups) {
      const gid = group.parentGroupId;
      if (gid && group.parentGroupName) {
        if (emitted.has(gid)) continue;
        emitted.add(gid);
        items.push({ kind: "header", id: gid, name: group.parentGroupName });
        for (const member of areaGroups.filter((a) => a.parentGroupId === gid)) {
          items.push({ kind: "area", group: member, indented: true });
        }
      } else {
        items.push({ kind: "area", group, indented: false });
      }
    }
    return items;
  }, [areaGroups, expandGroups]);

  // Switching floors clears any in-progress selection so tasks are never completed cross-floor.
  useEffect(() => {
    setSelectedIds(new Set());
    setNote("");
    setRating(null);
    setInspectPhotos([]);
  }, [selectedFloor]);

  // Resolve the current selection into concrete task occurrences (fanning an area-group row
  // out to every member area's copy) — used for both saved draft photos and completion.
  const selectedTargets = useMemo(() => {
    const displayRows = areaGroups.flatMap((g) => g.tasks).filter((t) => selectedIds.has(occKey(t)));
    const targets = new Map<string, TaskOccurrence>();
    for (const row of displayRows) {
      // Only the cleaner's collapsed-group row fans a completion across every member area;
      // inspection keeps each area separate.
      if (row.areaGroupId && groupAreas) {
        const identity = row.groupTaskKey ?? row.name;
        for (const o of occurrences) {
          if (
            o.floorName === selectedFloor &&
            o.status !== "COMPLETED" &&
            o.areaGroupId === row.areaGroupId &&
            (o.groupTaskKey ?? o.name) === identity
          ) {
            targets.set(`${o.taskId}|${o.occurrenceDate}`, o);
          }
        }
      } else {
        targets.set(`${row.taskId}|${row.occurrenceDate}`, row);
      }
    }
    return Array.from(targets.values());
  }, [areaGroups, occurrences, selectedFloor, selectedIds, groupAreas]);

  // Non-redo occurrences carry draft photos (redos aren't scheduled task occurrences).
  const draftRefs = useMemo(
    () =>
      selectedTargets
        .filter((t) => !t.redoId && t.taskId)
        .map((t) => ({ taskId: t.taskId as string, date: t.occurrenceDate })),
    [selectedTargets],
  );

  const draftsQuery = useDraftPhotos(draftRefs, selectedIds.size > 0 && !inspectMode);
  const drafts = draftsQuery.data ?? [];

  function selectableKeys(group: AreaGroup): string[] {
    // Inspection excludes redo tasks (those are cleaner obligations) and already-done rows.
    return group.tasks
      .filter((t) => !isDone(t, inspectMode) && (!inspectMode || !t.isRedo))
      .map(occKey);
  }

  function toggleTask(key: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleArea(group: AreaGroup) {
    const keys = selectableKeys(group);
    if (keys.length === 0) return;
    const allSelected = keys.every((k) => selectedIds.has(k));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) keys.forEach((k) => next.delete(k));
      else keys.forEach((k) => next.add(k));
      return next;
    });
  }

  function toggleCollapsed(areaId: string) {
    setExpandedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(areaId)) next.delete(areaId);
      else next.add(areaId);
      return next;
    });
  }

  function handlePhotosPicked(fileList: FileList | null, stage: "BEFORE" | "AFTER") {
    if (!fileList || fileList.length === 0 || draftRefs.length === 0) return;
    // Upload immediately so the shots persist server-side and reappear when the box reopens.
    const files = Array.from(fileList);
    saveDraftPhotos.mutate({ occurrences: draftRefs, type: stage, photos: files });
  }

  function resetSelection() {
    setSelectedIds(new Set());
    setNote("");
    setRating(null);
    setInspectPhotos([]);
  }

  // Occurrences for the current selection (non-redo) as inspection refs.
  const inspectRefs = () =>
    selectedTargets
      .filter((t) => !t.redoId && t.taskId)
      .map((t) => ({ taskId: t.taskId as string, date: t.occurrenceDate }));

  function handleComplete() {
    // Saved draft photos are folded into the completion server-side, so only occurrences + note
    // are sent here.
    const selected = selectedTargets;
    if (selected.length === 0) return;
    completeTasks.mutate(
      {
        occurrences: selected.map((t) => ({
          taskId: t.taskId as string,
          date: t.occurrenceDate,
          redoId: t.redoId ?? undefined,
        })),
        note: note.trim() || undefined,
      },
      { onSuccess: resetSelection },
    );
  }

  function handleInspectComplete() {
    const refs = inspectRefs();
    if (refs.length === 0 || !onInspectSubmit) return;
    onInspectSubmit(refs, rating ?? undefined, resetSelection);
  }

  function handleInspectComplaint() {
    const refs = inspectRefs();
    if (refs.length === 0 || !onInspectComplaint) return;
    onInspectComplaint(refs, note.trim(), inspectPhotos, resetSelection);
  }

  function handleInspectPhotosPicked(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setInspectPhotos((prev) => [...prev, ...Array.from(fileList)]);
  }

  const hasSelection = selectedIds.size > 0;

  if (areaGroups.length === 0) {
    return <p className="rounded-2xl bg-grey-50 p-4 text-sm text-grey-500">No tasks in this floor.</p>;
  }

  return (
    <>
      <div className={cn("flex flex-col gap-3", hasSelection && "pb-72")}>
        {renderItems.map((item) => {
          if (item.kind === "header") {
            return (
              <div key={`hdr-${item.id}`} className="mt-1 flex items-center gap-2 px-1">
                <Layers size={15} className="text-primary" aria-hidden="true" />
                <span className="text-sm font-semibold text-ink">{item.name}</span>
              </div>
            );
          }
          const group = item.group;
          const keys = selectableKeys(group);
          const areaSelected = keys.length > 0 && keys.every((k) => selectedIds.has(k));
          const completedCount = group.tasks.filter((t) => isDone(t, inspectMode)).length;
          const isCollapsed = !expandedAreas.has(group.areaId);
          // High/Medium tasks are always visible under the area; low tasks show once expanded.
          const priorityTasks = group.tasks.filter(
            (t) => t.criticalLevel === "HIGH" || t.criticalLevel === "MEDIUM",
          );
          const shownTasks = isCollapsed ? priorityTasks : group.tasks;
          const allCompleted =
            group.tasks.length > 0 && group.tasks.every((t) => isDone(t, inspectMode));

          return (
            <section
              key={group.areaId}
              className={cn(
                "overflow-hidden rounded-2xl border shadow-sm",
                item.indented && "ml-3 border-l-2 border-l-primary/30 sm:ml-6",
                allCompleted ? "border-success/30 bg-success/10" : "border-grey-200 bg-white",
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-3 border-b px-4 py-3",
                  allCompleted ? "border-success/20" : "border-grey-100",
                )}
              >
                {selecting && (
                  <button
                    type="button"
                    onClick={() => toggleArea(group)}
                    disabled={keys.length === 0}
                    aria-pressed={areaSelected || allCompleted}
                    aria-label={`Select all tasks in ${group.areaName}`}
                    className={cn("shrink-0", keys.length === 0 && !allCompleted && "opacity-40")}
                  >
                    {areaSelected || allCompleted ? (
                      <SquareCheck size={20} className={allCompleted ? "text-success" : "text-ink"} />
                    ) : (
                      <Square size={20} className="text-grey-400" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => toggleCollapsed(group.areaId)}
                  aria-expanded={!isCollapsed}
                  className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
                >
                  <span className="truncate text-sm font-semibold text-on-surface">{group.areaName}</span>
                  <span className="flex items-center gap-2">
                    <span className="shrink-0 rounded-full bg-grey-100 px-2 py-0.5 text-xs font-medium text-grey-600">
                      {String(completedCount).padStart(2, "0")}/{String(group.tasks.length).padStart(2, "0")}
                    </span>
                    <ChevronDown
                      size={16}
                      className={cn("text-grey-400 transition-transform", isCollapsed && "-rotate-90")}
                      aria-hidden="true"
                    />
                  </span>
                </button>
              </div>

              {shownTasks.length > 0 && (
                <ul className="divide-y divide-grey-100">
                  {shownTasks.map((task) => {
                    const key = occKey(task);
                    const isCompleted = isDone(task, inspectMode);
                    const isRedo = Boolean(task.isRedo);
                    const selected = selectedIds.has(key);
                    // Inspection can't act on redo rows (cleaner obligations).
                    const selectable = selecting && !isCompleted && (!inspectMode || !isRedo);
                    const accent = isRedo
                      ? task.colorHex ?? "#7C3AED"
                      : assignmentTypeColor(task.assignmentType);

                    const rowInner = (
                      <>
                        <span className="mt-0.5 shrink-0">
                          {selecting ? (
                            selectable ? (
                              selected ? (
                                <SquareCheck size={18} className="text-ink" />
                              ) : (
                                <Square size={18} className="text-grey-400" />
                              )
                            ) : (
                              <SquareCheck size={18} className="text-success" />
                            )
                          ) : (
                            <span
                              className="mt-1 block h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: accent }}
                            />
                          )}
                        </span>
                        <span className="flex min-w-0 flex-1 items-start justify-between gap-3">
                          <span className="flex min-w-0 flex-col gap-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium leading-snug text-on-surface">
                                {task.name}
                              </span>
                              {isRedo ? (
                                <span
                                  className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                                  style={{ backgroundColor: task.colorHex ?? "#7C3AED" }}
                                >
                                  {task.isComplaint ? "Complaint Redo" : "Redo"}
                                </span>
                              ) : (
                                <span
                                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                                  style={{ color: accent, backgroundColor: `${accent}1A` }}
                                >
                                  {assignmentTypeLabel(task.assignmentType ?? "OTHER")}
                                </span>
                              )}
                            </span>
                            {task.shiftName && (
                              <span className="text-xs text-grey-500">
                                {task.shiftName}
                                {task.shiftStartTime && task.shiftEndTime
                                  ? ` · ${task.shiftStartTime.slice(0, 5)}–${task.shiftEndTime.slice(0, 5)}`
                                  : ""}
                              </span>
                            )}
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            {(task.criticalLevel === "HIGH" || task.criticalLevel === "MEDIUM") && (
                              <Flag
                                size={14}
                                fill={PRIORITY_META[task.criticalLevel].fill}
                                strokeWidth={1.75}
                                className={PRIORITY_META[task.criticalLevel].text}
                                aria-label={`${PRIORITY_META[task.criticalLevel].label} priority`}
                              />
                            )}
                            {isCompleted && (
                              <Check size={16} className="text-success" aria-label="Completed" />
                            )}
                          </span>
                        </span>
                      </>
                    );

                    return (
                      <li
                        key={key}
                        className={cn("flex items-stretch pl-4", isCompleted && "bg-success/10")}
                      >
                        {selectable ? (
                          <button
                            type="button"
                            onClick={() => toggleTask(key)}
                            aria-pressed={selected}
                            className={cn(
                              "flex flex-1 items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-grey-50",
                              selected && "bg-primary/5",
                            )}
                          >
                            {rowInner}
                          </button>
                        ) : (
                          <div className="flex flex-1 items-start gap-3 px-4 py-3">
                            {rowInner}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setInfoTask(task)}
                          aria-label={`Details for ${task.name}`}
                          title="Task details"
                          className="flex shrink-0 items-center px-3 text-grey-400 transition-colors hover:bg-grey-50 hover:text-primary"
                        >
                          <Info size={18} aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {/* Hidden file inputs: camera capture + gallery/file picker, per before/after bucket */}
      <input
        ref={beforeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          handlePhotosPicked(e.target.files, "BEFORE");
          e.target.value = "";
        }}
      />
      <input
        ref={beforeGalleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handlePhotosPicked(e.target.files, "BEFORE");
          e.target.value = "";
        }}
      />
      <input
        ref={afterCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          handlePhotosPicked(e.target.files, "AFTER");
          e.target.value = "";
        }}
      />
      <input
        ref={afterGalleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handlePhotosPicked(e.target.files, "AFTER");
          e.target.value = "";
        }}
      />
      <input
        ref={inspectPhotoInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleInspectPhotosPicked(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Completion panel — mobile bottom sheet; desktop centered card. No backdrop so the
          cleaner can keep adjusting the selection behind it. */}
      {hasSelection && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Complete selected tasks"
          className={cn(
            "fixed z-[60] bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)]",
            "inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl",
            "lg:inset-0 lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:max-h-[85vh] lg:w-full lg:max-w-md lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-3xl lg:shadow-2xl",
          )}
        >
          <div className="mx-auto max-w-2xl px-5 py-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-on-surface">
                {selectedIds.size} task{selectedIds.size > 1 ? "s" : ""} selected
              </p>
              <button
                type="button"
                onClick={resetSelection}
                aria-label="Cancel selection"
                className="shrink-0 rounded-full p-0.5 text-danger transition-colors hover:bg-danger/10"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            {inspectMode && (
              <>
                <div className="mb-3">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-grey-500">
                    Rating <span className="text-grey-400">(optional)</span>
                  </p>
                  <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                    {RATINGS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating((prev) => (prev === value ? null : value))}
                        aria-pressed={rating === value}
                        className={cn(
                          "rounded-xl border py-2 text-sm font-medium transition-colors",
                          rating === value
                            ? "border-primary bg-primary text-white"
                            : "border-grey-300 text-on-surface hover:bg-grey-100",
                        )}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note (required when raising a complaint)"
                  rows={2}
                  maxLength={2048}
                  className="mb-3 w-full resize-none rounded-xl border border-grey-300 p-3 text-sm text-on-surface outline-none focus:border-primary"
                />

                <div className="mb-3">
                  <button
                    type="button"
                    onClick={() => inspectPhotoInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-grey-300 py-2.5 text-sm font-medium text-grey-700 transition-colors hover:bg-grey-50"
                  >
                    <ImagePlus size={18} /> Add photos{inspectPhotos.length > 0 ? ` (${inspectPhotos.length})` : ""}
                  </button>
                  {inspectPhotos.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {inspectPreviews.map((url, index) => (
                        <div key={url} className="relative h-16 w-16 overflow-hidden rounded-lg">
                          <button
                            type="button"
                            onClick={() => setLightboxUrl(url)}
                            aria-label="View photo full screen"
                            className="block h-full w-full"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="" className="h-full w-full object-cover" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setInspectPhotos((prev) => prev.filter((_, i) => i !== index))}
                            aria-label="Remove photo"
                            className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleInspectComplaint}
                    disabled={inspectPending}
                    className="flex-1 rounded-xl bg-[#ED5F25] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    Mark as Complaint
                  </button>
                  <button
                    type="button"
                    onClick={handleInspectComplete}
                    disabled={inspectPending}
                    className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {inspectPending ? "Saving…" : "Complete Inspection"}
                  </button>
                </div>
              </>
            )}

            {!inspectMode && (
              <>
            {(["BEFORE", "AFTER"] as const).map((stage) => {
              const isBefore = stage === "BEFORE";
              const stageDrafts = drafts.filter((p) => (p.type ?? "AFTER") === stage);
              const cameraRef = isBefore ? beforeCameraInputRef : afterCameraInputRef;
              const galleryRef = isBefore ? beforeGalleryInputRef : afterGalleryInputRef;
              return (
                <div key={stage} className="mb-3">
                  <div className="mb-1.5 flex items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-grey-500">
                      {isBefore ? "Before photos" : "After photos"}
                    </p>
                    {saveDraftPhotos.isPending && (
                      <span className="text-[10px] text-grey-400">Saving…</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => cameraRef.current?.click()}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-grey-300 py-2.5 text-sm font-medium text-grey-700 transition-colors hover:bg-grey-50"
                    >
                      <Camera size={18} />
                      Take Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => galleryRef.current?.click()}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-grey-300 py-2.5 text-sm font-medium text-grey-700 transition-colors hover:bg-grey-50"
                    >
                      <ImagePlus size={18} />
                      Add Photos
                    </button>
                  </div>
                  {stageDrafts.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {stageDrafts.map((p) => {
                        const url = `/api${ENDPOINTS.tasks.draftPhotoImage(p.id)}`;
                        return (
                          <div key={p.id} className="relative h-16 w-16 overflow-hidden rounded-lg">
                            <button
                              type="button"
                              onClick={() => setLightboxUrl(url)}
                              aria-label="View photo full screen"
                              className="block h-full w-full"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt="" className="h-full w-full object-cover" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteDraftPhoto.mutate(p.id)}
                              aria-label="Remove photo"
                              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note (optional)"
              rows={2}
              maxLength={2048}
              className="mb-3 w-full resize-none rounded-xl border border-grey-300 p-3 text-sm text-on-surface outline-none focus:border-primary"
            />

            <button
              type="button"
              onClick={handleComplete}
              disabled={completeTasks.isPending}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {completeTasks.isPending ? "Completing…" : "Complete"}
            </button>
              </>
            )}
          </div>
        </div>
      )}

      <ImageLightbox src={lightboxUrl} onClose={() => setLightboxUrl(null)} />

      {infoTask && (
        <TaskInfoPopup
          task={infoTask}
          memberAreas={
            infoTask.areaGroupId
              ? Array.from(
                  new Set(
                    occurrences
                      .filter(
                        (o) =>
                          o.areaGroupId === infoTask.areaGroupId &&
                          (o.groupTaskKey ?? o.name) === (infoTask.groupTaskKey ?? infoTask.name) &&
                          !!o.areaName,
                      )
                      .map((o) => o.areaName as string),
                  ),
                )
              : []
          }
          onClose={() => setInfoTask(null)}
        />
      )}
    </>
  );
}
