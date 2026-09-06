"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  ChevronDown,
  ImagePlus,
  Square,
  SquareCheck,
  X,
} from "lucide-react";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import { useCompleteTasks } from "@/features/tasks/hooks/useTasks";
import { assignmentTypeColor, assignmentTypeLabel } from "@/features/tasks/lib/task-utils";
import type { TaskOccurrence, TaskStatus } from "@/features/tasks/schemas/task.schema";
import { cn } from "@/lib/utils/cn";

const STATUS_LABEL: Record<TaskStatus, string> = {
  SCHEDULED: "Scheduled",
  ACTIVE: "Active",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_COLOR: Record<TaskStatus, string> = {
  SCHEDULED: "bg-[#ED5F25]/15 text-[#ED5F25]",
  ACTIVE: "bg-[#ED5F25]/15 text-[#ED5F25]",
  IN_PROGRESS: "bg-primary/15 text-ink",
  COMPLETED: "bg-success/15 text-success",
  CANCELLED: "bg-grey-200 text-grey-600",
};

/** Stable selection key: redos are keyed by their redoId, regular tasks by taskId. */
function occKey(task: TaskOccurrence): string {
  return task.redoId ?? (task.taskId as string);
}

interface AreaGroup {
  areaId: string;
  areaName: string;
  tasks: TaskOccurrence[];
}

interface TaskListViewProps {
  occurrences: TaskOccurrence[];
  selectedFloor: string | null;
  /** Cleaners checked in to the site may select and complete; otherwise the list is read-only. */
  canComplete: boolean;
}

/** Floor-grouped list of areas with their tasks as a nested sub-list, with area-wise and
 *  individual task completion for cleaners. */
export function TaskListView({ occurrences, selectedFloor, canComplete }: TaskListViewProps) {
  const completeTasks = useCompleteTasks();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Membership = expanded; areas start collapsed by default.
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const areaGroups = useMemo<AreaGroup[]>(() => {
    const map = new Map<string, AreaGroup>();
    for (const o of occurrences) {
      if (o.floorName !== selectedFloor || !o.areaId || !o.areaName) continue;
      const group = map.get(o.areaId) ?? { areaId: o.areaId, areaName: o.areaName, tasks: [] };
      group.tasks.push(o);
      map.set(o.areaId, group);
    }
    // Incomplete tasks first within each area (stable), completed pushed to the bottom.
    for (const group of map.values()) {
      group.tasks.sort(
        (a, b) => (a.status === "COMPLETED" ? 1 : 0) - (b.status === "COMPLETED" ? 1 : 0),
      );
    }
    return Array.from(map.values());
  }, [occurrences, selectedFloor]);

  // Switching floors clears any in-progress selection so tasks are never completed cross-floor.
  useEffect(() => {
    setSelectedIds(new Set());
    setNote("");
    setPhotos([]);
  }, [selectedFloor]);

  const previews = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);
  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  function selectableKeys(group: AreaGroup): string[] {
    return group.tasks.filter((t) => t.status !== "COMPLETED").map(occKey);
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

  function handlePhotosPicked(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setPhotos((prev) => [...prev, ...files]);
  }

  function resetSelection() {
    setSelectedIds(new Set());
    setNote("");
    setPhotos([]);
  }

  function handleComplete() {
    const selected = occurrences.filter(
      (t) => t.floorName === selectedFloor && selectedIds.has(occKey(t)),
    );
    if (selected.length === 0) return;
    completeTasks.mutate(
      {
        occurrences: selected.map((t) => ({
          taskId: t.taskId as string,
          date: t.occurrenceDate,
          redoId: t.redoId ?? undefined,
        })),
        note: note.trim() || undefined,
        photos,
      },
      { onSuccess: resetSelection },
    );
  }

  const hasSelection = selectedIds.size > 0;

  if (areaGroups.length === 0) {
    return <p className="rounded-2xl bg-grey-50 p-4 text-sm text-grey-500">No tasks in this floor.</p>;
  }

  return (
    <>
      <div className={cn("flex flex-col gap-3", hasSelection && "pb-72")}>
        {areaGroups.map((group) => {
          const keys = selectableKeys(group);
          const areaSelected = keys.length > 0 && keys.every((k) => selectedIds.has(k));
          const completedCount = group.tasks.filter((t) => t.status === "COMPLETED").length;
          const isCollapsed = !expandedAreas.has(group.areaId);

          return (
            <section
              key={group.areaId}
              className="overflow-hidden rounded-2xl border border-grey-200 bg-white shadow-sm"
            >
              <div className="flex items-center gap-3 border-b border-grey-100 px-4 py-3">
                {canComplete && (
                  <button
                    type="button"
                    onClick={() => toggleArea(group)}
                    disabled={keys.length === 0}
                    aria-pressed={areaSelected}
                    aria-label={`Select all tasks in ${group.areaName}`}
                    className="shrink-0 disabled:opacity-40"
                  >
                    {areaSelected ? (
                      <SquareCheck size={20} className="text-ink" />
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

              {!isCollapsed && (
                <ul className="divide-y divide-grey-100">
                  {group.tasks.map((task) => {
                    const key = occKey(task);
                    const isCompleted = task.status === "COMPLETED";
                    const isRedo = Boolean(task.isRedo);
                    const selected = selectedIds.has(key);
                    const selectable = canComplete && !isCompleted;
                    const accent = isRedo
                      ? task.colorHex ?? "#7C3AED"
                      : assignmentTypeColor(task.assignmentType);

                    const rowInner = (
                      <>
                        <span className="mt-0.5 shrink-0">
                          {canComplete ? (
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
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                              STATUS_COLOR[task.status],
                            )}
                          >
                            {STATUS_LABEL[task.status]}
                          </span>
                        </span>
                      </>
                    );

                    return (
                      <li key={key}>
                        {selectable ? (
                          <button
                            type="button"
                            onClick={() => toggleTask(key)}
                            aria-pressed={selected}
                            className={cn(
                              "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-grey-50",
                              selected && "bg-primary/5",
                            )}
                          >
                            {rowInner}
                          </button>
                        ) : (
                          <div
                            className={cn(
                              "flex items-start gap-3 px-4 py-3",
                              isCompleted && "bg-success/5",
                            )}
                          >
                            {rowInner}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {/* Hidden file inputs: camera capture + gallery/file picker */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          handlePhotosPicked(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handlePhotosPicked(e.target.files);
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

            <div className="mb-3 flex gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-grey-300 py-2.5 text-sm font-medium text-grey-700 transition-colors hover:bg-grey-50"
              >
                <Camera size={18} />
                Take Photo
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-grey-300 py-2.5 text-sm font-medium text-grey-700 transition-colors hover:bg-grey-50"
              >
                <ImagePlus size={18} />
                Add Photos
              </button>
            </div>

            {photos.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {previews.map((url, index) => (
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
                      onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== index))}
                      aria-label="Remove photo"
                      className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

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
          </div>
        </div>
      )}

      <ImageLightbox src={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </>
  );
}
