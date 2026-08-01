"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Camera, ImagePlus, Square, SquareCheck, X } from "lucide-react";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { PageHeader } from "@/components/shared/PageHeader";
import { CalendarModal } from "@/components/modals/CalendarModal";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useMyTasks, useCompleteTasks, useReviewComplete } from "@/features/tasks/hooks/useTasks";
import { useCreateComplaint } from "@/features/complaints/hooks/useCreateComplaint";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { toLocalDateString } from "@/features/tasks/lib/task-utils";
import type { TaskStatus } from "@/features/tasks/schemas/task.schema";
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
  const completeTasks = useCompleteTasks();
  const reviewComplete = useReviewComplete();
  const createComplaint = useCreateComplaint();

  const role = useAuthStore((s) => s.user?.role);
  const isSupervisor = role === "SUPERVISOR";

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Cleaners only act on pending tasks; supervisors review all tasks in the area.
  const tasks = useMemo(
    () =>
      occurrences.filter(
        (o) =>
          (areaId ? o.areaId === areaId : true) &&
          (isSupervisor ? true : o.status !== "COMPLETED"),
      ),
    [occurrences, areaId, isSupervisor],
  );

  const selectableIds = useMemo(() => tasks.map((t) => t.taskId), [tasks]);
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
  }

  function handleComplete() {
    const selected = tasks.filter((t) => selectedIds.has(t.taskId));
    if (selected.length === 0) return;
    completeTasks.mutate(
      {
        occurrences: selected.map((t) => ({ taskId: t.taskId, date: t.occurrenceDate })),
        note: note.trim() || undefined,
        photos,
      },
      { onSuccess: resetActionState },
    );
  }

  function handleReviewComplete() {
    const selected = tasks.filter((t) => selectedIds.has(t.taskId));
    if (selected.length === 0) return;
    reviewComplete.mutate(
      selected.map((t) => ({ taskId: t.taskId, date: t.occurrenceDate })),
      { onSuccess: resetActionState },
    );
  }

  function handleComplaint() {
    const selected = tasks.filter((t) => selectedIds.has(t.taskId));
    if (selected.length === 0) return;
    createComplaint.mutate(
      {
        input: {
          occurrences: selected.map((t) => ({ taskId: t.taskId, date: t.occurrenceDate })),
          description: note.trim() || undefined,
        },
        photos,
      },
      { onSuccess: resetActionState },
    );
  }

  const supervisorPending = reviewComplete.isPending || createComplaint.isPending;
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
        {tasks.length > 0 && (
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
            {isSupervisor ? "No tasks in this area." : "No pending tasks in this area."}
          </p>
        ) : (
          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-3">
            {tasks.map((task) => {
              const selected = selectedIds.has(task.taskId);
              return (
                <button
                  key={`${task.taskId}-${task.occurrenceDate}`}
                  onClick={() => toggleTaskSelected(task.taskId)}
                  aria-pressed={selected}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-2xl bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md",
                    selected && "ring-2 ring-primary",
                  )}
                >
                  <span className="mt-0.5 shrink-0">
                    {selected ? (
                      <SquareCheck size={20} className="text-primary" />
                    ) : (
                      <Square size={20} className="text-grey-500" />
                    )}
                  </span>

                  <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="text-sm font-semibold leading-snug text-[#1A1A1A]">
                        {task.name}
                      </span>
                      {task.floorName && (
                        <span className="text-xs text-grey-500">{task.floorName}</span>
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
                </button>
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

      {/* Bottom completion panel */}
      {hasSelection && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-grey-200 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
          <div className="mx-auto max-w-2xl px-5 py-4 lg:max-w-5xl">
            <p className="mb-3 text-sm font-medium text-on-surface">
              {isSupervisor ? "Review — " : ""}
              {selectedIds.size} task{selectedIds.size > 1 ? "s" : ""} selected
            </p>

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
            ) : (
              <button
                onClick={handleComplete}
                disabled={completeTasks.isPending}
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {completeTasks.isPending ? "Completing…" : "Complete"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      <CalendarModal open={calendarOpen} onClose={() => setCalendarOpen(false)} />

      {!hasSelection && <BottomNavBar />}
    </div>
  );
}
