"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, ImagePlus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { CompleteTaskSchema, type CompleteTaskInput } from "@/features/inspections/schemas/inspection.schema";
import type { AreaInspection } from "@/features/inspections/types";

interface InspectingTaskModalProps {
  open:            boolean;
  onClose:         () => void;
  area:            AreaInspection | null;
  onComplete:      (area: AreaInspection, data: CompleteTaskInput) => void;
  onAddComplaint:  (area: AreaInspection) => void;
}

const RATINGS = Array.from({ length: 10 }, (_, i) => i + 1);

interface UploadedImage {
  id:   string;
  name: string;
}

function ImageThumb({ image, onRemove }: { image: UploadedImage; onRemove: () => void }) {
  return (
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-grey-100 text-xs text-grey-500">
      {image.name}
      <button
        type="button"
        aria-label={`Remove ${image.name}`}
        onClick={onRemove}
        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white"
      >
        <Trash2 size={10} aria-hidden="true" />
      </button>
    </div>
  );
}

export function InspectingTaskModal({
  open,
  onClose,
  area,
  onComplete,
  onAddComplaint,
}: InspectingTaskModalProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);

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
  }, [open, area, reset]);

  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    if (open) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]);

  function handleFormSubmit(data: CompleteTaskInput) {
    if (!area) return;
    onComplete(area, data);
    handleClose();
  }

  function handleAddImage() {
    setImages((prev) => [...prev, { id: `img-${Date.now()}-${prev.length}`, name: `IMG ${prev.length + 1}` }]);
  }

  if (!open || !area) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspecting-task-title"
    >
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-surface shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 id="inspecting-task-title" className="text-lg font-medium text-primary">
            Inspecting Task
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
            <div className="rounded-xl bg-grey-100 p-4">
              <p className="text-sm font-medium text-on-surface">{area.site} - {area.area}</p>
            </div>

            <div className="mt-4">
              <p className="mb-1.5 text-sm font-medium text-on-surface">Uploaded Images</p>
              <div className="flex flex-wrap gap-3">
                {images.map((image) => (
                  <ImageThumb
                    key={image.id}
                    image={image}
                    onRemove={() => setImages((prev) => prev.filter((i) => i.id !== image.id))}
                  />
                ))}
                <button
                  type="button"
                  onClick={handleAddImage}
                  aria-label="Add image"
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-grey-300 text-grey-500 transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <ImagePlus size={20} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-1.5">
              <label htmlFor="inspecting-task-notes" className="text-sm font-medium text-on-surface">
                Inspection Notes
              </label>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <textarea
                    id="inspecting-task-notes"
                    rows={3}
                    placeholder="Add notes about the inspection, findings, or any issues discovered..."
                    {...field}
                    className="resize-none rounded-xl border border-grey-300 px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                )}
              />
            </div>

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

          <div className="flex gap-3 px-6 pb-6 pt-4">
            <button
              type="submit"
              className="h-11 flex-1 rounded-xl bg-primary text-sm font-medium text-white transition-colors hover:bg-primary-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Complete Task
            </button>
            <button
              type="button"
              onClick={() => {
                onAddComplaint(area);
                handleClose();
              }}
              className="h-11 flex-1 rounded-xl border border-grey-300 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Add Complaint
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
