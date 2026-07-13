"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useCallback, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { CreateComplaintSchema, type CreateComplaintInput } from "@/features/complaints/schemas/complaint.schema";

interface AddComplaintModalProps {
  open:     boolean;
  onClose:  () => void;
  onSubmit: (data: CreateComplaintInput) => void;
}

const DEFAULT_VALUES: CreateComplaintInput = {
  title: "",
  description: "",
  site: "",
  floor: "",
  priority: "medium",
  reporterRole: "",
};

export function AddComplaintModal({ open, onClose, onSubmit }: AddComplaintModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateComplaintInput>({
    resolver:      zodResolver(CreateComplaintSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) reset(DEFAULT_VALUES);
  }, [open, reset]);

  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    if (open) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]);

  function handleFormSubmit(data: CreateComplaintInput) {
    onSubmit(data);
    handleClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-complaint-title"
    >
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-lg rounded-3xl bg-surface shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 id="add-complaint-title" className="text-lg font-medium text-primary">
            Add Complaint
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
          <div className="flex flex-col gap-4 px-6 pb-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="complaint-title" className="text-sm font-medium text-on-surface">Title</label>
              <input
                id="complaint-title"
                type="text"
                placeholder="e.g., Restroom cleaning issue"
                {...register("title")}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary",
                  errors.title ? "border-danger" : "border-grey-300",
                )}
              />
              {errors.title && <p className="text-xs text-danger">{errors.title.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="complaint-description" className="text-sm font-medium text-on-surface">Description</label>
              <textarea
                id="complaint-description"
                rows={3}
                placeholder="Describe the issue..."
                {...register("description")}
                className={cn(
                  "resize-none rounded-xl border px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary",
                  errors.description ? "border-danger" : "border-grey-300",
                )}
              />
              {errors.description && <p className="text-xs text-danger">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="complaint-site" className="text-sm font-medium text-on-surface">Site</label>
                <input
                  id="complaint-site"
                  type="text"
                  placeholder="e.g., Site A"
                  {...register("site")}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary",
                    errors.site ? "border-danger" : "border-grey-300",
                  )}
                />
                {errors.site && <p className="text-xs text-danger">{errors.site.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="complaint-floor" className="text-sm font-medium text-on-surface">Location</label>
                <input
                  id="complaint-floor"
                  type="text"
                  placeholder="e.g., Floor 2 - Restrooms"
                  {...register("floor")}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary",
                    errors.floor ? "border-danger" : "border-grey-300",
                  )}
                />
                {errors.floor && <p className="text-xs text-danger">{errors.floor.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="complaint-priority" className="text-sm font-medium text-on-surface">Priority</label>
                <select
                  id="complaint-priority"
                  {...register("priority")}
                  className="rounded-xl border border-grey-300 px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="complaint-reporter" className="text-sm font-medium text-on-surface">Reported By</label>
                <input
                  id="complaint-reporter"
                  type="text"
                  placeholder="e.g., Building Manager"
                  {...register("reporterRole")}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary",
                    errors.reporterRole ? "border-danger" : "border-grey-300",
                  )}
                />
                {errors.reporterRole && <p className="text-xs text-danger">{errors.reporterRole.message}</p>}
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 pt-4">
            <button
              type="submit"
              className="h-11 w-full rounded-xl bg-primary text-sm font-medium text-white transition-colors hover:bg-primary-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Add Complaint
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
