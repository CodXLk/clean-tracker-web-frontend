"use client";

import { useState } from "react";
import { Clock, Plus, Star, Trash2, Loader2, Moon } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import {
  useSiteShifts,
  useCreateShift,
  useSetDefaultShift,
  useDeleteShift,
} from "@/features/user-management/hooks/useSiteShifts";
import {
  ShiftFormSchema,
  type ShiftFormInput,
} from "@/features/user-management/schemas/shift.schema";
import type { Site } from "@/features/user-management/schemas/site.schema";

interface ShiftsModalProps {
  open: boolean;
  onClose: () => void;
  site: Site | null;
}

function hhmm(value: string): string {
  return value.slice(0, 5);
}

export function ShiftsModal({ open, onClose, site }: ShiftsModalProps) {
  const shiftsQuery = useSiteShifts(open ? site?.id : undefined);
  const createShift = useCreateShift();
  const setDefault = useSetDefaultShift();
  const deleteShift = useDeleteShift();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ShiftFormInput>({
    resolver: zodResolver(ShiftFormSchema),
    defaultValues: { name: "", startTime: "", endTime: "", isDefault: false },
  });

  const [localError, setLocalError] = useState<string | null>(null);

  const shifts = shiftsQuery.data ?? [];
  const busy = createShift.isPending || setDefault.isPending || deleteShift.isPending;

  function onSubmit(values: ShiftFormInput) {
    if (!site) return;
    setLocalError(null);
    createShift.mutate(
      { siteId: site.id, input: values },
      {
        onSuccess: () => reset({ name: "", startTime: "", endTime: "", isDefault: false }),
        onError: (e) => setLocalError(getErrorMessage(e)),
      },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={site ? `Shifts — ${site.name}` : "Shifts"}
      description="Define one or more work windows. If no shifts exist, the working day is treated as 24 hours."
      maxWidthClassName="max-w-2xl"
    >
      <div className="flex flex-col gap-4">
        {shiftsQuery.isLoading ? (
          <div className="flex justify-center py-6 text-grey-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : shifts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-grey-200 px-3 py-6 text-center text-sm text-grey-500">
            No shifts yet — this site runs a full 24-hour day.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {shifts.map((shift) => (
              <li
                key={shift.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-grey-200 p-3"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium text-on-surface">
                    <Clock className="h-4 w-4 text-grey-400" /> {shift.name}
                    {shift.isDefault && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        <Star className="h-3 w-3" /> Default
                      </span>
                    )}
                    {shift.crossesMidnight && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-grey-100 px-2 py-0.5 text-xs font-medium text-grey-600">
                        <Moon className="h-3 w-3" /> Overnight
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-grey-500">
                    {hhmm(shift.startTime)} – {hhmm(shift.endTime)}
                    {shift.crossesMidnight ? " (next day)" : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!shift.isDefault && site && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setDefault.mutate({ siteId: site.id, shiftId: shift.id })}
                      className="rounded-full border border-grey-200 px-3 py-1.5 text-xs font-medium text-on-surface hover:bg-grey-50 disabled:opacity-50"
                    >
                      Set default
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => site && deleteShift.mutate({ siteId: site.id, shiftId: shift.id })}
                    className="rounded-full p-1.5 text-grey-400 hover:bg-error/10 hover:text-error disabled:opacity-50"
                    aria-label="Delete shift"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 rounded-xl border border-grey-200 p-3">
          <p className="text-sm font-medium text-on-surface">Add a shift</p>
          <TextField label="Shift name" placeholder="e.g. Night shift" error={errors.name?.message} {...register("name")} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Start time" type="time" error={errors.startTime?.message} {...register("startTime")} />
            <TextField label="End time" type="time" error={errors.endTime?.message} {...register("endTime")} />
          </div>
          <p className="text-xs text-grey-500">
            Set an end time earlier than the start (e.g. 22:00 – 06:00) for an overnight shift.
          </p>
          <label className="flex items-center gap-2 text-sm text-on-surface">
            <input type="checkbox" className="h-4 w-4 rounded border-grey-300" {...register("isDefault")} />
            Make this the default shift
          </label>
          {localError && (
            <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
              {localError}
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createShift.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:opacity-90 disabled:opacity-50"
            >
              {createShift.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add shift
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
