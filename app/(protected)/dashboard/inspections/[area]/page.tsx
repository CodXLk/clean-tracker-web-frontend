"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Camera, CalendarDays, ImagePlus, Square, SquareCheck, X } from "lucide-react";
import { useIsDrawerNav } from "@/components/layout/AppNav";
import { PageHeader } from "@/components/shared/PageHeader";
import { CalendarModal } from "@/components/modals/CalendarModal";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { CheckInRequiredBanner } from "@/components/shared/CheckInRequiredBanner";
import {
  useMyTasks,
  useCompleteTasks,
  useCompleteForInspection,
  useSubmitInspection,
  useTaskHistory,
} from "@/features/tasks/hooks/useTasks";
import { useCreateComplaint } from "@/features/complaints/hooks/useCreateComplaint";
import { useMySites } from "@/features/attendance/hooks/useAttendance";
import { useMe } from "@/features/auth/hooks/useMe";
import { toLocalDateString } from "@/features/tasks/lib/task-utils";
import type { TaskOccurrence, TaskStatus } from "@/features/tasks/schemas/task.schema";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { isAdminRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils/cn";

const RATINGS = Array.from({ length: 10 }, (_, i) => i + 1);

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
  IN_PROGRESS: "bg-primary/20 text-ink",
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

interface AreaInspectionPageProps {
  params: Promise<PageParams>;
}

function historyDateLabel(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function historyTimeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function AreaInspectionPage({ params }: AreaInspectionPageProps) {
  const useDrawerNav = useIsDrawerNav();
  const { area } = use(params);
  const areaName = decodeURIComponent(area);

  const searchParams = useSearchParams();
  const areaId = searchParams.get("areaId");
  const date = searchParams.get("date") ?? toLocalDateString(new Date());

  const { data: occurrences = [], isLoading } = useMyTasks(date);
  const { data: sites = [] } = useMySites(date);
  const completeTasks = useCompleteTasks();
  const completeForInspection = useCompleteForInspection();
  const submitInspection = useSubmitInspection();
  const createComplaint = useCreateComplaint();

  const role = useMe().data?.role;
  // Management (SUPER_ADMIN/COMPANY_ADMIN/CLIENT_SERVICE_MANAGER) gets the same
  // inspection panel as a SUPERVISOR — the backend already grants them the same
  // access (see AccessGuard.isManagement / requireSupervisorSite).
  const isSupervisor = role === "SUPERVISOR" || isAdminRole(role);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [rating, setRating] = useState<number | null>(null);
  const [completeBlockedError, setCompleteBlockedError] = useState<string | null>(null);
  const [fullscreenPhotoUrl, setFullscreenPhotoUrl] = useState<string | null>(null);

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

  // Display gate: hide all tasks unless the supervisor is currently checked in (a checkout
  // hides them again). Management/admins are exempt since they don't check in.
  const isCheckedInToAreaSiteNow =
    areaSiteId !== null && sites.some((s) => s.siteId === areaSiteId && s.status === "CHECKED_IN");
  const mustCheckIn = !isAdminRole(role) && !isCheckedInToAreaSiteNow;

  // Three-tier ordering (stable within each group): not-yet-completed first, then
  // completed-but-not-yet-checked, then checked (inspected) last.
  const tasks = useMemo(() => {
    const incomplete: TaskOccurrence[] = [];
    const completed: TaskOccurrence[] = [];
    const checked: TaskOccurrence[] = [];
    for (const o of areaTasks) {
      if (o.status !== "COMPLETED") {
        incomplete.push(o);
      } else if (o.inspected) {
        checked.push(o);
      } else {
        completed.push(o);
      }
    }
    return [...incomplete, ...completed, ...checked];
  }, [areaTasks]);

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
    // Snapshot into a plain array immediately — fileList is a live reference to the
    // input's FileList, and the input gets cleared (value = "") right after this call
    // returns, which would otherwise empty it out before the setState updater below runs.
    const files = Array.from(fileList);
    setPhotos((prev) => [...prev, ...files]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function resetActionState() {
    setSelectedIds(new Set());
    setNote("");
    setPhotos([]);
    setRating(null);
    setDragPosition(null);
    setCompleteBlockedError(null);
    setFullscreenPhotoUrl(null);
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

  function handleCompleteForInspection() {
    // Redo occurrences are completed by cleaners, not by a supervisor here.
    const selected = tasks.filter((t) => selectedIds.has(occKey(t)) && !t.isRedo);
    if (selected.length === 0) return;
    completeForInspection.mutate(
      {
        occurrences: selected.map((t) => ({ taskId: t.taskId as string, date: t.occurrenceDate })),
        note: note.trim() || undefined,
        photos,
      },
      {
        // Keep the selection open — once the refetch lands the task(s) show as COMPLETED
        // and this same panel switches to the rating/complaint inspection actions.
        onSuccess: () => {
          setNote("");
          setPhotos([]);
        },
      },
    );
  }

  function handleCompleteInspection() {
    if (rating === null) return;
    // Redo occurrences are completed by cleaners, not inspected directly.
    const selected = tasks.filter((t) => selectedIds.has(occKey(t)) && !t.isRedo);
    if (selected.length === 0) return;
    submitInspection.mutate(
      {
        occurrences: selected.map((t) => ({ taskId: t.taskId as string, date: t.occurrenceDate })),
        rating,
      },
      { onSuccess: resetActionState },
    );
  }

  // Closes out the inspection (links it to the just-created complaint) after the complaint
  // itself is already raised. This runs "fire and forget" from the panel's perspective —
  // the complaint is the primary action and has already succeeded by the time this is
  // called, so a failure here (logged, not thrown at the user) must not leave the panel
  // stuck open, since retrying the visible button would re-raise a duplicate complaint.
  function closeInspectionForComplaint(
    selected: TaskOccurrence[],
    complaintId: string,
  ) {
    submitInspection.mutate(
      {
        occurrences: selected.map((t) => ({ taskId: t.taskId as string, date: t.occurrenceDate })),
        complaintId,
      },
      {
        onError: (error) => {
          console.error("Failed to close out inspection for complaint", complaintId, error);
        },
      },
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
      {
        onSuccess: (complaint) => {
          closeInspectionForComplaint(selected, complaint.id);
          resetActionState();
        },
      },
    );
  }

  const supervisorPending =
    submitInspection.isPending ||
    createComplaint.isPending ||
    completeForInspection.isPending;
  const hasSelection = selectedIds.size > 0;

  // Completion photos are shown read-only when exactly one already-completed task is
  // selected — reviewing what the cleaner uploaded, distinct from the supervisor's own
  // new complaint photos below.
  const singleSelectedTask = useMemo(() => {
    if (!isSupervisor || selectedIds.size !== 1) return null;
    const [key] = selectedIds;
    return tasks.find((t) => occKey(t) === key) ?? null;
  }, [isSupervisor, selectedIds, tasks]);

  // Past-days history for the clicked task, so the supervisor can review the days they
  // missed since the site's last inspection (notes, photos with dates, completion log).
  const historyTaskId = singleSelectedTask?.taskId ?? null;
  const { data: taskHistory } = useTaskHistory(
    historyTaskId ?? null,
    date,
    isSupervisor && !!historyTaskId,
  );

  // A supervisor can only inspect (rate/complain) tasks that are already completed —
  // otherwise the panel walks them through completing it first.
  const selectedTasksForSupervisor = useMemo(
    () => tasks.filter((t) => selectedIds.has(occKey(t))),
    [tasks, selectedIds],
  );
  const allSelectedCompleted =
    selectedTasksForSupervisor.length > 0 &&
    selectedTasksForSupervisor.every((t) => t.status === "COMPLETED");

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at top left, rgba(71,114,115,0.18) 0%, transparent 60%), #F5F5F5",
      }}
    >
      {!useDrawerNav && (
        <div className="lg:hidden">
          <PageHeader title={areaName} showCalendar onCalendarClick={() => setCalendarOpen(true)} />
        </div>
      )}

      <main
        className={cn(
          "mx-auto max-w-2xl px-5 lg:max-w-5xl",
          !useDrawerNav ? "pt-5 -mt-5" : "pt-5",
          hasSelection ? "pb-[22rem]" : "pb-28",
        )}
      >
        <div className="flex items-center justify-between pb-3">
          <button
            type="button"
            onClick={() => setCalendarOpen(true)}
            aria-label="Open calendar"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-ink transition-colors hover:bg-primary/20"
          >
            <CalendarDays size={18} strokeWidth={2} />
          </button>
          {selectableIds.length > 0 && !mustCheckIn && (
            <button
              onClick={toggleSelectAll}
              aria-pressed={allSelected}
              className="flex items-center gap-2 text-sm text-grey-700 transition-colors hover:text-ink"
            >
              {allSelected ? (
                <SquareCheck size={20} className="text-ink" />
              ) : (
                <Square size={20} className="text-grey-500" />
              )}
              Select All
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : mustCheckIn ? (
          <CheckInRequiredBanner action="inspect" />
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
              // A completed task the supervisor has already closed out (rating or
              // complaint) reads as "Checked" instead of the generic "Completed" —
              // the underlying status stays COMPLETED everywhere else (Tasks page,
              // inventory deduction, KPI stats); this is purely a display distinction
              // driven by the inspection record.
              const isChecked = isCompleted && task.inspected === true;
              // Cleaners have no valid action on an already-completed task; supervisors
              // keep full interactivity on every status (review/complaint flows).
              const isSelectable = isSupervisor || !isCompleted;

              const cardClassName = cn(
                "flex w-full items-start gap-3 rounded-2xl p-4 text-left shadow-sm transition-shadow",
                isSelectable && "hover:shadow-md",
                isChecked
                  ? "border border-indigo-500/20 bg-indigo-500/10"
                  : isCompleted
                    ? "border border-success/20 bg-success/10"
                    : "bg-white",
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
                        <SquareCheck size={20} className="text-ink" />
                      ) : (
                        <Square size={20} className="text-grey-500" />
                      )
                    ) : (
                      <SquareCheck size={20} className={isChecked ? "text-indigo-600" : "text-success"} />
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
                        {task.shiftName && (
                          <span className="rounded-full bg-grey-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-grey-600">
                            {task.shiftName}
                            {task.shiftStartTime && task.shiftEndTime
                              ? ` · ${task.shiftStartTime.slice(0, 5)}–${task.shiftEndTime.slice(0, 5)}`
                              : ""}
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
                        isChecked ? "bg-indigo-500/15 text-indigo-600" : STATUS_COLOR_MAP[task.status],
                      )}
                    >
                      {isChecked ? "Checked" : STATUS_LABEL_MAP[task.status]}
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

            {/* Task history since the site's last inspection — the days this supervisor
                missed: whether it was completed, the cleaner's note, and any photos. */}
            {isSupervisor && singleSelectedTask && taskHistory && (
              <div className="mb-3">
                <p className="mb-1.5 text-sm font-medium text-on-surface">
                  History since last inspection
                  <span className="font-normal text-grey-500">
                    {" "}
                    · {historyDateLabel(taskHistory.sinceDate)} – {historyDateLabel(taskHistory.toDate)}
                  </span>
                </p>
                {taskHistory.days.length === 0 ? (
                  <p className="rounded-lg bg-grey-100 px-3 py-2 text-xs text-grey-500">
                    No scheduled days or activity in this period.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {taskHistory.days.map((d) => (
                      <div key={d.date} className="rounded-xl border border-grey-200 p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-on-surface">
                            {historyDateLabel(d.date)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                d.completed
                                  ? "bg-success/15 text-success"
                                  : "bg-[#ED5F25]/15 text-[#ED5F25]",
                              )}
                            >
                              {d.completed ? "Completed" : "Not completed"}
                            </span>
                            {d.inspected && (
                              <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">
                                Inspected
                              </span>
                            )}
                          </span>
                        </div>
                        {(d.completedByName || d.completedAt) && (
                          <p className="mt-0.5 text-[11px] text-grey-500">
                            {d.completedByName ? `by ${d.completedByName}` : ""}
                            {d.completedAt ? ` · ${historyTimeLabel(d.completedAt)}` : ""}
                          </p>
                        )}
                        {d.note && <p className="mt-1 text-xs text-grey-700">{d.note}</p>}
                        {d.photos.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {d.photos.map((p) => {
                              const url = `/api${ENDPOINTS.tasks.photo(p.id)}`;
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => setFullscreenPhotoUrl(url)}
                                  aria-label="View photo full screen"
                                  className="relative h-16 w-16 overflow-hidden rounded-lg bg-grey-100"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={url} alt="Task completion" className="h-full w-full object-cover" />
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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

            {/* Photo thumbnails — preview of what will upload with Complete */}
            {photos.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {previews.map((url, index) => (
                  <div key={url} className="relative h-16 w-16 overflow-hidden rounded-lg">
                    <button
                      type="button"
                      onClick={() => setFullscreenPhotoUrl(url)}
                      aria-label="View photo full screen"
                      className="block h-full w-full"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </button>
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
              allSelectedCompleted ? (
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="mb-1.5 text-sm font-medium text-on-surface">
                      Inspection Rating <span className="text-grey-500">(only needed to complete without a complaint)</span>
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

                  {rating === null ? (
                    <>
                      <div className="flex gap-2">
                        <button
                          onClick={handleComplaint}
                          disabled={supervisorPending}
                          className="flex-1 rounded-xl bg-[#ED5F25] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                        >
                          {createComplaint.isPending ? "Submitting…" : "Mark as Complaint"}
                        </button>
                        <button
                          onClick={handleCompleteInspection}
                          disabled={supervisorPending || rating === null}
                          className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                        >
                          {submitInspection.isPending ? "Saving…" : "Complete Inspection"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={handleCompleteInspection}
                      disabled={supervisorPending}
                      className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      {submitInspection.isPending ? "Saving…" : "Complete Inspection"}
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-grey-600">
                    This task isn&apos;t completed yet. Add photos above if needed, then complete it before you can inspect it.
                  </p>
                  <button
                    onClick={handleCompleteForInspection}
                    disabled={supervisorPending}
                    className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {completeForInspection.isPending ? "Completing…" : "Complete Task"}
                  </button>
                </div>
              )
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

      {/* Full-screen completion photo viewer */}
      {fullscreenPhotoUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Full-screen photo"
          onClick={() => setFullscreenPhotoUrl(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
        >
          <button
            type="button"
            onClick={() => setFullscreenPhotoUrl(null)}
            aria-label="Close full-screen photo"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X size={20} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fullscreenPhotoUrl}
            alt="Task completion, full screen"
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
}
