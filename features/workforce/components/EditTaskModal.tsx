"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Pencil, X } from "lucide-react";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import {
  useTaskEditDetail,
  useUpdateTaskDetails,
  uploadTaskReferencePhotos,
  deleteTaskReferencePhoto,
} from "@/features/workforce/hooks/useAssignments";

function referencePhotoUrl(photoId: string): string {
  return `/api${ENDPOINTS.assignments.referencePhoto(photoId)}`;
}

interface EditTaskModalProps {
  taskId: string;
  onClose: () => void;
  onSaved?: () => void;
}

/** Scope-view task edit popup: rename the task and, for HIGH tasks, edit the note and
 *  add/remove reference photos. Nothing is applied unless the save succeeds. */
export function EditTaskModal({ taskId, onClose, onSaved }: EditTaskModalProps) {
  const detailQuery = useTaskEditDetail(taskId);
  const updateMutation = useUpdateTaskDetails();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [existingIds, setExistingIds] = useState<string[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const detail = detailQuery.data;
  const isHigh = detail?.criticalLevel === "HIGH";

  // Seed the form once the task loads.
  useEffect(() => {
    if (!detail) return;
    setName(detail.name);
    setNote(detail.criticalNote ?? "");
    setExistingIds(detail.referencePhotoIds ?? []);
    setRemovedIds([]);
    setNewFiles([]);
  }, [detail]);

  const previews = useMemo(
    () => newFiles.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })),
    [newFiles],
  );
  useEffect(() => {
    return () => previews.forEach((p) => URL.revokeObjectURL(p.url));
  }, [previews]);

  const visibleExisting = existingIds.filter((id) => !removedIds.includes(id));

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (picked.length > 0) setNewFiles((prev) => [...prev, ...picked]);
  }

  async function handleSave() {
    if (name.trim().length < 2) {
      setError("Task name must be at least 2 characters.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateMutation.mutateAsync({
        taskId,
        name: name.trim(),
        criticalNote: isHigh ? note.trim() : null,
      });
      for (const id of removedIds) await deleteTaskReferencePhoto(id);
      if (isHigh && newFiles.length > 0) await uploadTaskReferencePhotos(taskId, newFiles);
      await queryClient.invalidateQueries({ queryKey: ["task-edit-detail", taskId] });
      onSaved?.();
      onClose();
    } catch (e) {
      setError(getErrorMessage(e));
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => !saving && onClose()}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-task-title"
        className="relative z-10 flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-grey-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-ink">
              <Pencil size={16} aria-hidden="true" />
            </span>
            <h2 id="edit-task-title" className="text-base font-semibold text-on-surface">
              Edit task
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-grey-100 disabled:opacity-50"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {detailQuery.isLoading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        ) : detailQuery.isError || !detail ? (
          <p className="px-5 py-10 text-center text-sm text-danger">
            {detailQuery.isError ? getErrorMessage(detailQuery.error) : "Task not found."}
          </p>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <div>
                <label htmlFor="edit-task-name" className="mb-1.5 block text-sm font-medium text-on-surface">
                  Task name
                </label>
                <input
                  id="edit-task-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={150}
                  className="w-full rounded-xl border border-grey-300 bg-white px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {isHigh && (
                <>
                  <div>
                    <label
                      htmlFor="edit-task-note"
                      className="mb-1.5 block text-sm font-medium text-on-surface"
                    >
                      High-priority note
                    </label>
                    <textarea
                      id="edit-task-note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={4}
                      maxLength={4000}
                      placeholder="What must the cleaner know? (shown at check-in)"
                      className="w-full resize-none rounded-xl border border-grey-300 bg-white px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <p className="mb-1.5 text-sm font-medium text-on-surface">Reference photos</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {visibleExisting.map((id) => {
                        const url = referencePhotoUrl(id);
                        return (
                          <div
                            key={id}
                            className="relative h-16 w-16 overflow-hidden rounded-lg border border-grey-200"
                          >
                            <button
                              type="button"
                              onClick={() => setLightboxUrl(url)}
                              className="h-full w-full"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt="Reference" className="h-full w-full object-cover" />
                            </button>
                            <button
                              type="button"
                              aria-label="Remove photo"
                              onClick={() => setRemovedIds((prev) => [...prev, id])}
                              className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-bl-md bg-black/60 text-white"
                            >
                              <X size={10} aria-hidden="true" />
                            </button>
                          </div>
                        );
                      })}
                      {previews.map((p, i) => (
                        <div
                          key={p.url}
                          className="relative h-16 w-16 overflow-hidden rounded-lg border border-primary/40"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
                          <button
                            type="button"
                            aria-label={`Remove new photo ${i + 1}`}
                            onClick={() => setNewFiles((prev) => prev.filter((_, idx) => idx !== i))}
                            className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-bl-md bg-black/60 text-white"
                          >
                            <X size={10} aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                      <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-grey-300 text-grey-500 transition-colors hover:border-primary hover:text-ink">
                        <ImagePlus size={16} aria-hidden="true" />
                        <span className="text-[10px]">Add</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={onPickFiles}
                        />
                      </label>
                    </div>
                  </div>
                </>
              )}

              {error && (
                <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>
              )}
            </div>

            <div className="flex gap-3 border-t border-grey-100 px-5 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 rounded-xl border border-grey-300 px-4 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-variant disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </>
        )}
      </div>

      <ImageLightbox src={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </div>
  );
}
