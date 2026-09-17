"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";

interface SetHighPriorityModalProps {
  taskName: string;
  onCancel: () => void;
  /** Runs the save (level → HIGH, note + photos). Throws on failure so the modal stays open. */
  onSubmit: (note: string, files: File[]) => Promise<void>;
}

/** Prompt shown when a task is raised to HIGH: capture a note + reference photos.
 *  The level only changes if the save succeeds — a failed submit leaves everything as-is. */
export function SetHighPriorityModal({ taskName, onCancel, onSubmit }: SetHighPriorityModalProps) {
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previews = useMemo(
    () => files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })),
    [files],
  );
  useEffect(() => {
    return () => previews.forEach((p) => URL.revokeObjectURL(p.url));
  }, [previews]);

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (picked.length > 0) setFiles((prev) => [...prev, ...picked]);
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(note.trim(), files);
    } catch (e) {
      setError(getErrorMessage(e));
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => !submitting && onCancel()}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="high-priority-title"
        className="relative z-10 flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-grey-100 bg-danger/5 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-danger">
              <AlertTriangle size={18} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="high-priority-title" className="text-base font-semibold text-on-surface">
                Set high priority
              </h2>
              <p className="truncate text-xs text-grey-500">{taskName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            aria-label="Cancel"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-grey-100 disabled:opacity-50"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <label htmlFor="high-priority-note" className="mb-1.5 block text-sm font-medium text-on-surface">
              Note for the cleaner
            </label>
            <textarea
              id="high-priority-note"
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
              {previews.map((p, i) => (
                <div
                  key={p.url}
                  className="relative h-16 w-16 overflow-hidden rounded-lg border border-grey-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    aria-label={`Remove photo ${i + 1}`}
                    onClick={() => removeFile(i)}
                    className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-bl-md bg-black/60 text-white"
                  >
                    <X size={10} aria-hidden="true" />
                  </button>
                </div>
              ))}
              <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-grey-300 text-grey-500 transition-colors hover:border-primary hover:text-ink">
                <ImagePlus size={16} aria-hidden="true" />
                <span className="text-[10px]">Add</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={onPickFiles} />
              </label>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>
          )}
        </div>

        <div className="flex gap-3 border-t border-grey-100 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 rounded-xl border border-grey-300 px-4 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl bg-danger px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-danger/90 disabled:opacity-60",
            )}
          >
            {submitting ? "Saving…" : "Set high priority"}
          </button>
        </div>
      </div>
    </div>
  );
}
