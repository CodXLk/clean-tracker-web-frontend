"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Camera, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { CompleteTaskSchema, type CompleteTaskInput } from "@/features/inspections/schemas/inspection.schema";

export interface CompleteTaskTarget {
  id:       string;
  title:    string;
  subtitle: string;
}

interface CompleteTaskModalProps {
  open:    boolean;
  onClose: () => void;
  target:  CompleteTaskTarget | null;
  onSubmit: (id: string, data: CompleteTaskInput) => void;
}

const RATINGS = Array.from({ length: 10 }, (_, i) => i + 1);

export function CompleteTaskModal({ open, onClose, target, onSubmit }: CompleteTaskModalProps) {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CompleteTaskInput>({
    resolver:      zodResolver(CompleteTaskSchema),
    defaultValues: { notes: "", qualityRating: 0 },
  });

  useEffect(() => {
    if (open) {
      reset({ notes: "", qualityRating: 0 });
    }
  }, [open, target, reset]);

  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    if (open) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]);

  function handleFormSubmit(data: CompleteTaskInput) {
    if (!target) return;
    onSubmit(target.id, data);
    handleClose();
  }

  function handleAddFile(source: "photo" | "upload") {
    setUploadedFiles((prev) => [...prev, `${source === "photo" ? "Photo" : "File"} ${prev.length + 1}`]);
  }

  if (!open || !target) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="complete-task-title"
    >
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-surface shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 id="complete-task-title" className="text-lg font-medium text-primary">
            Complete Task
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
            {/* Task summary */}
            <div className="rounded-xl bg-grey-100 p-4">
              <p className="text-sm font-medium text-on-surface">{target.title}</p>
              <p className="mt-0.5 text-sm text-grey-500">{target.subtitle}</p>
            </div>

            {/* Upload evidence */}
            <div className="mt-4">
              <p className="mb-1.5 text-sm font-medium text-on-surface">Upload Evidence</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleAddFile("photo")}
                  className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-grey-300 py-5 text-sm text-on-surface transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Camera size={20} className="text-primary" aria-hidden="true" />
                  Take Photo
                </button>
                <button
                  type="button"
                  onClick={() => handleAddFile("upload")}
                  className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-grey-300 py-5 text-sm text-on-surface transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Upload size={20} className="text-primary" aria-hidden="true" />
                  Upload Photo
                </button>
              </div>
              <div className="mt-3 rounded-xl border border-grey-200 p-3">
                <p className="text-xs font-medium text-grey-500">Uploaded Files</p>
                {uploadedFiles.length === 0 ? (
                  <p className="mt-4 text-center text-sm text-grey-500">No files uploaded yet</p>
                ) : (
                  <ul className="mt-2 flex flex-col gap-1">
                    {uploadedFiles.map((file) => (
                      <li key={file} className="text-sm text-on-surface">{file}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="mt-4 flex flex-col gap-1.5">
              <label htmlFor="complete-task-notes" className="text-sm font-medium text-on-surface">
                Inspection Notes
              </label>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <textarea
                    id="complete-task-notes"
                    rows={3}
                    placeholder="Add notes about the inspection, findings, or any issues discovered..."
                    {...field}
                    className="resize-none rounded-xl border border-grey-300 px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                )}
              />
            </div>

            {/* Quality rating */}
            <div className="mt-4">
              <p className="mb-1.5 text-sm font-medium text-on-surface">Quality Rating</p>
              <Controller
                name="qualityRating"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                    {RATINGS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => field.onChange(value)}
                        aria-pressed={field.value === value}
                        className={cn(
                          "rounded-xl border py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                          field.value === value
                            ? "border-primary bg-primary text-white"
                            : "border-grey-300 text-on-surface hover:bg-grey-100",
                        )}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                )}
              />
              {errors.qualityRating && (
                <p className="mt-1 text-xs text-danger">{errors.qualityRating.message}</p>
              )}
            </div>
          </div>

          <div className="px-6 pb-6 pt-4">
            <button
              type="submit"
              className="h-11 w-full rounded-xl bg-primary text-sm font-medium text-white transition-colors hover:bg-primary-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Complete Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
