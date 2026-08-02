"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Camera, ImagePlus, Square, SquareCheck, X } from "lucide-react";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { PageHeader } from "@/components/shared/PageHeader";
import { CalendarModal } from "@/components/modals/CalendarModal";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useMyTasks, useCompleteTasks, useReviewComplete } from "@/features/tasks/hooks/useTasks";
import { useCreateComplaint } from "@/features/complaints/hooks/useCreateComplaint";
import { useComplaintWithRedo } from "@/features/complaints/hooks/useComplaintWithRedo";
import { useMySites } from "@/features/attendance/hooks/useAttendance";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { toLocalDateString } from "@/features/tasks/lib/task-utils";
import type { TaskOccurrence, TaskStatus } from "@/features/tasks/schemas/task.schema";
import { cn } from "@/lib/utils/cn";

const STATUS_LABEL_MAP: Record<TaskStatus, string> = {
  SCHEDULED: "Scheduled",
  ACTIVE: "Active",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_COLOR_MAP: Record<TaskStatus, string> = {
  SCHEDULED: "bg-[#ED5F25]/20 text-[#ED5F25]",
  ACTIVE: "bg-[#ED5F25]/20 text-[#ED5F25]",
  IN_PROGRESS: "bg-primary/20 text-primary",
  COMPLETED: "bg-success/20 text-success",
  CANCELLED: "bg-grey-200 text-grey-600",
};

interface PageParams {
  area: string;
}

/** Stable selection key: redos are keyed by their redoId, regular tasks by taskId. */
function occKey(task: TaskOccurrence): string {
  return task.redoId ?? (task.taskId as string);
}

interface AreaTaskPageProps {
  params: Promise<PageParams>;
}

export default function AreaTaskPage({ params }: AreaTaskPageProps) {
  const { area } = use(params);
  const areaName = decodeURIComponent(area);

  const searchParams = useSearchParams();
  const areaId = searchParams.get("areaId");
  const date = searchParams.get("date") ?? toLocalDateString(new Date());

  const { data: occurrences = [], isLoading } = useMyTasks(date);
  const { data: sites = [] } = useMySites(date);
  const completeTasks = useCompleteTasks();
  const reviewComplete = useReviewComplete();
  const createComplaint = useCreateComplaint();
  const complaintWithRedo = useComplaintWithRedo();

  const role = useAuthStore((s) => s.user?.role);
  const isSupervisor = role === "SUPERVISOR";

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [completeBlockedError, setCompleteBlockedError] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Desktop-only dragging for the completion panel: null until the cleaner drags it, at
  // which point it switches from the centered layout to an explicit pixel position.
  const panelRef = useRef<HTMLDivElement>(null);
  const dragOriginRef = useRef<{ startX: number; startY: number; originLeft: number; originTop: number } | null>(null);
  const [dragPosition, setDragPosition] = useState<{ left: number; top: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleDragHandlePointerDown(e: React.PointerEvent) {
    // Mobile keeps the fixed bottom sheet — only the desktop floating card is movable.
    if (window.innerWidth < 1024 || !panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    dragOriginRef.current = { startX: e.clientX, startY: e.clientY, originLeft: rect.left, originTop: rect.top };
    setDragPosition({ left: rect.left, top: rect.top });
    setIsDragging(true);
  }

  useEffect(() => {
    if (!isDragging) return;

    function onPointerMove(e: PointerEvent) {
      const origin = dragOriginRef.current;
      const panel = panelRef.current;
      if (!origin || !panel) return;
      const maxLeft = Math.max(window.innerWidth - panel.offsetWidth, 0);
      const maxTop = Math.max(window.innerHeight - panel.offsetHeight, 0);
      setDragPosition({
        left: Math.min(Math.max(origin.originLeft + (e.clientX - origin.startX), 0), maxLeft),
        top: Math.min(Math.max(origin.originTop + (e.clientY - origin.startY), 0), maxTop),
      });
    }
    function onPointerUp() {
      dragOriginRef.current = null;
      setIsDragging(false);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [isDragging]);

  // All occurrences in this area, regardless of status — role-agnostic.
  const areaTasks = useMemo(
    () => occurrences.filter((o) => (areaId ? o.areaId === areaId : true)),
    [occurrences, areaId],
  );

  // A cleaner must have checked in to this area's site at some point today to complete
  // tasks here. They don't need to be checked in right now — CHECKED_OUT still counts,
  // since that status is only ever reached after an earlier check-in the same day; only
  // never having checked in at all (no status) blocks them.
  const areaSiteId = areaTasks[0]?.siteId ?? null;
  const areaSiteName = areaTasks[0]?.siteName ?? "this site";
  const hasCheckedInToAreaSiteToday =
    areaSiteId !== null &&
    sites.some(
      (s) => s.siteId === areaSiteId && (s.status === "CHECKED_IN" || s.status === "CHECKED_OUT"),
    );

  // Supervisors review everything in original order. Cleaners see everything too, but
  // completed tasks are pushed to the bottom (stable partition, relative order preserved
  // within each group) as they finish.
  const tasks = useMemo(() => {
    if (isSupervisor) return areaTasks;
    const incomplete: TaskOccurrence[] = [];
    const completed: TaskOccurrence[] = [];
    for (const o of areaTasks) {
      (o.status === "COMPLETED" ? completed : incomplete).push(o);
    }
    return [...incomplete, ...completed];
  }, [areaTasks, isSupervisor]);

  // Cleaners can't act on an already-completed task; supervisors can select any status.
  const selectableIds = useMemo(() => {
    const selectable = isSupervisor ? tasks : tasks.filter((t) => t.status !== "COMPLETED");
    return selectable.map((t) => occKey(t));
  }, [tasks, isSupervisor]);
  const allSelected = selectedIds.size > 0 && selectedIds.size === selectableIds.length;

  // Object URLs for photo previews.
  const previews = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);
  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  function toggleTaskSelected(taskId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds(allSelected ? new Set() : new Set(selectableIds));
  }

  function handlePhotosPicked(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setPhotos((prev) => [...prev, ...Array.from(fileList)]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function resetActionState() {
    setSelectedIds(new Set());
    setNote("");
    setPhotos([]);
    setDragPosition(null);
    setCompleteBlockedError(null);
  }

  function handleComplete() {
    if (!hasCheckedInToAreaSiteToday) {
      setCompleteBlockedError(
        `You need to check in to ${areaSiteName} today before you can complete tasks here.`,
      );
      return;
    }
    const selected = tasks.filter((t) => selectedIds.has(occKey(t)));
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
      { onSuccess: resetActionState },
    );
  }

  function handleReviewComplete() {
    // Redo occurrences are completed by cleaners, not marked done during review.
    const selected = tasks.filter((t) => selectedIds.has(occKey(t)) && !t.isRedo);
    if (selected.length === 0) return;
    reviewComplete.mutate(
      selected.map((t) => ({ taskId: t.taskId as string, date: t.occurrenceDate })),
      { onSuccess: resetActionState },
    );
  }

  function handleComplaint() {
    const selected = tasks.filter((t) => selectedIds.has(occKey(t)) && !t.isRedo);
    if (selected.length === 0) return;
    createComplaint.mutate(
      {
        input: {
          occurrences: selected.map((t) => ({ taskId: t.taskId as string, date: t.occurrenceDate })),
          description: note.trim() || undefined,
        },
        photos,
      },
      { onSuccess: resetActionState },
    );
  }

  function handleComplaintWithRedo() {
    const selected = tasks.filter((t) => selectedIds.has(occKey(t)) && !t.isRedo);
    if (selected.length === 0) return;
    complaintWithRedo.mutate(
      {
        input: {
          occurrences: selected.map((t) => ({ taskId: t.taskId as string, date: t.occurrenceDate })),
          description: note.trim() || undefined,
        },
        photos,
      },
      { onSuccess: resetActionState },
    );
  }

  const supervisorPending =
    reviewComplete.isPending || createComplaint.isPending || complaintWithRedo.isPending;
  const hasSelection = selectedIds.size > 0;

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at top left, rgba(71,114,115,0.18) 0%, transparent 60%), #F5F5F5",
      }}
    >
      <PageHeader title={areaName} showCalendar onCalendarClick={() => setCalendarOpen(true)} />

      <main
        className={cn(
          "mx-auto max-w-2xl px-5 lg:max-w-5xl -mt-5",
          hasSelection ? "pb-[22rem]" : "pb-28",
        )}
      >
        {selectableIds.length > 0 && (
          <div className="flex items-center justify-end pt-5 pb-3">
            <button
              onClick={toggleSelectAll}
              aria-pressed={allSelected}
              className="flex items-center gap-2 text-sm text-grey-700 transition-colors hover:text-primary"
            >
              {allSelected ? (
                <SquareCheck size={20} className="text-primary" />
              ) : (
                <Square size={20} className="text-grey-500" />
              )}
              Select All
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : tasks.length === 0 ? (
          <p className="py-16 text-center text-sm text-grey-500">
            No tasks in this area.
          </p>
        ) : (
          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-3">
            {tasks.map((task) => {
              const key = occKey(task);
              const selected = selectedIds.has(key);
              const isRedo = Boolean(task.isRedo);
              const isCompleted = task.status === "COMPLETED";
              // Cleaners have no valid action on an already-completed task; supervisors
              // keep full interactivity on every status (review/complaint flows).
              const isSelectable = isSupervisor || !isCompleted;

              const cardClassName = cn(
                "flex w-full items-start gap-3 rounded-2xl p-4 text-left shadow-sm transition-shadow",
                isSelectable && "hover:shadow-md",
                isCompleted ? "border border-success/20 bg-success/10" : "bg-white",
                selected && "ring-2 ring-primary",
                isRedo && "border-l-4",
              );
              const cardStyle = isRedo
                ? { borderLeftColor: task.colorHex ?? "#7C3AED" }
                : undefined;

              const cardContent = (
                <>
                  <span className="mt-0.5 shrink-0">
                    {isSelectable ? (
                      selected ? (
                        <SquareCheck size={20} className="text-primary" />
                      ) : (
                        <Square size={20} className="text-grey-500" />
                      )
                    ) : (
                      <SquareCheck size={20} className="text-success" />
                    )}
                  </span>

                  <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold leading-snug text-[#1A1A1A]">
                          {task.name}
                        </span>
                        {isRedo && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                            style={{ backgroundColor: task.colorHex ?? "#7C3AED" }}
                          >
                            {task.isComplaint ? "Complaint Redo" : "Redo"}
                          </span>
                        )}
                      </div>
                      {task.floorName && (
                        <span className="text-xs text-grey-500">{task.floorName}</span>
                      )}
                      {isRedo && task.description && (
                        <span className="text-xs text-grey-600">{task.description}</span>
                      )}
                      <span className="text-xs text-grey-500">{task.date}</span>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-3 py-0.5 text-xs font-medium",
                        STATUS_COLOR_MAP[task.status],
                      )}
                    >
                      {STATUS_LABEL_MAP[task.status]}
                    </span>
                  </div>
                </>
              );

              return isSelectable ? (
                <button
                  key={key}
                  onClick={() => toggleTaskSelected(key)}
                  aria-pressed={selected}
                  className={cardClassName}
                  style={cardStyle}
                >
                  {cardContent}
                </button>
              ) : (
                <div key={key} className={cardClassName} style={cardStyle} aria-disabled="true">
                  {cardContent}
                </div>
              );
            })}
          </div>
        )}
      </main>

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

      {/* Bottom completion panel — a mobile bottom sheet; on desktop (lg+) it matches the
          inventory popup's centered floating card, and can be dragged anywhere via the
          grip handle. No backdrop: tasks stay selectable behind the panel so the cleaner
          can keep building a multi-task selection. */}
      {hasSelection && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Complete selected tasks"
          className={cn(
            "fixed z-40 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)]",
            "inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl",
            dragPosition
              ? "lg:max-h-[85vh] lg:w-full lg:max-w-md lg:rounded-3xl lg:shadow-2xl"
              : "lg:inset-0 lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:max-h-[85vh] lg:w-full lg:max-w-md lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-3xl lg:shadow-2xl",
          )}
          style={
            dragPosition
              ? { left: dragPosition.left, top: dragPosition.top, right: "auto", bottom: "auto", transform: "none" }
              : undefined
          }
        >
          {/* Drag handle — desktop only; mobile keeps the fixed bottom sheet. */}
          <div
            onPointerDown={handleDragHandlePointerDown}
            className="hidden justify-center pb-2 pt-1 lg:flex lg:cursor-grab lg:active:cursor-grabbing"
          >
            <div className="h-1.5 w-10 rounded-full bg-grey-300" />
          </div>

          <div className="mx-auto max-w-2xl px-5 py-6 lg:max-w-5xl lg:pt-0">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-on-surface">
                {isSupervisor ? "Review — " : ""}
                {selectedIds.size} task{selectedIds.size > 1 ? "s" : ""} selected
              </p>
              <button
                type="button"
                onClick={resetActionState}
                aria-label="Cancel selection"
                className="shrink-0 rounded-full p-0.5 text-danger transition-colors hover:bg-danger/10"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            {/* Photo thumbnails */}
            {photos.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {previews.map((url, index) => (
                  <div key={url} className="relative h-16 w-16 overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      onClick={() => removePhoto(index)}
                      aria-label="Remove photo"
                      className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add photos */}
            <div className="mb-3 flex gap-2">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-grey-300 py-2.5 text-sm font-medium text-grey-700 transition-colors hover:bg-grey-50"
              >
                <Camera size={18} />
                Take Photo
              </button>
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-grey-300 py-2.5 text-sm font-medium text-grey-700 transition-colors hover:bg-grey-50"
              >
                <ImagePlus size={18} />
                Add Photos
              </button>
            </div>

            {/* Note */}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note (optional)"
              rows={2}
              maxLength={2048}
              className="mb-3 w-full resize-none rounded-xl border border-grey-300 p-3 text-sm text-on-surface outline-none focus:border-primary"
            />

            {isSupervisor ? (
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleComplaintWithRedo}
                  disabled={supervisorPending}
                  className="w-full rounded-xl bg-[#7C3AED] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {complaintWithRedo.isPending
                    ? "Scheduling…"
                    : "Complaint + Redo (next shift)"}
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleComplaint}
                    disabled={supervisorPending}
                    className="flex-1 rounded-xl bg-[#ED5F25] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {createComplaint.isPending ? "Submitting…" : "Mark as Complaint"}
                  </button>
                  <button
                    onClick={handleReviewComplete}
                    disabled={supervisorPending}
                    className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {reviewComplete.isPending ? "Saving…" : "Mark as Completed"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {completeBlockedError && !hasCheckedInToAreaSiteToday && (
                  <p className="mb-3 flex items-start gap-1.5 rounded-lg bg-error/10 px-3 py-2 text-xs font-medium text-error">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                    {completeBlockedError}
                  </p>
                )}
                <button
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

      {/* Calendar Modal */}
      <CalendarModal open={calendarOpen} onClose={() => setCalendarOpen(false)} />

      <BottomNavBar hideMobileBar={hasSelection} />
    </div>
  );
}
