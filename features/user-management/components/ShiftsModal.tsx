"use client";

import { useEffect, useState } from "react";
import { Clock, Plus, Pencil, Star, Trash2, Loader2, Moon, Check, Users, Eye } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { PanelOrModal } from "@/components/shared/PanelOrModal";
import { Modal } from "@/components/shared/Modal";
import { ConfirmDialog } from "./ConfirmDialog";
import { TextField } from "@/components/shared/TextField";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import {
  useSiteShifts,
  useCreateShift,
  useUpdateShift,
  useSetDefaultShift,
  useDeleteShift,
  useSetShiftCleaners,
} from "@/features/user-management/hooks/useSiteShifts";
import { useSiteCleanerProfiles } from "@/features/user-management/hooks/useSiteAssignments";
import { useSiteOutsourceProject } from "@/features/outsource/hooks/useOutsourceProjects";
import type { OutsourceCleanerProfile } from "@/features/outsource/schemas/outsourceProject.schema";
import {
  ShiftFormSchema,
  type Shift,
  type ShiftFormInput,
} from "@/features/user-management/schemas/shift.schema";
import {
  DAY_OF_WEEK_VALUES,
  type DayOfWeek,
  type SiteCleanerProfile,
} from "@/features/user-management/schemas/site.schema";
import type { Site } from "@/features/user-management/schemas/site.schema";

interface ShiftsModalProps {
  open: boolean;
  onClose: () => void;
  site: Site | null;
  embedded?: boolean;
}

const EMPTY_SHIFT: ShiftFormInput = { name: "", startTime: "", endTime: "", dayOfWeek: "", isDefault: false };

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

function hhmm(value: string): string {
  return value.slice(0, 5);
}

export function ShiftsModal({ open, onClose, site, embedded }: ShiftsModalProps) {
  const shiftsQuery = useSiteShifts(open ? site?.id : undefined);
  const cleanerProfilesQuery = useSiteCleanerProfiles(open ? site?.id : undefined);
  const outsourceQuery = useSiteOutsourceProject(open ? site?.id : undefined);
  const setDefault = useSetDefaultShift();
  const deleteShift = useDeleteShift();

  const inHouseProfiles = cleanerProfilesQuery.data ?? [];
  const outsourceProfiles = outsourceQuery.project?.cleanerProfiles ?? [];

  const [editor, setEditor] = useState<{ mode: "new" } | { mode: "edit"; shift: Shift } | null>(null);
  const [viewing, setViewing] = useState<Shift | null>(null);
  const [assigning, setAssigning] = useState<Shift | null>(null);
  const [deleting, setDeleting] = useState<Shift | null>(null);

  // Reset transient popups whenever the site changes or the panel closes.
  useEffect(() => {
    setEditor(null);
    setViewing(null);
    setAssigning(null);
    setDeleting(null);
  }, [open, site?.id]);

  const shifts = shiftsQuery.data ?? [];
  const busy = setDefault.isPending || deleteShift.isPending;
  const profilesLoading = cleanerProfilesQuery.isLoading || outsourceQuery.isLoading;

  function cleanerCount(shiftId: string): number {
    const a = inHouseProfiles.filter((p) => p.shifts.some((s) => s.id === shiftId)).length;
    const b = outsourceProfiles.filter((p) => p.shifts.some((s) => s.id === shiftId)).length;
    return a + b;
  }

  function confirmDelete() {
    if (!site || !deleting) return;
    deleteShift.mutate({ siteId: site.id, shiftId: deleting.id }, { onSuccess: () => setDeleting(null) });
  }

  return (
    <>
      <PanelOrModal
        embedded={embedded}
        open={open}
        onClose={onClose}
        title={site ? `Shifts — ${site.name}` : "Shifts"}
        description="Define one or more work windows. If no shifts exist, the working day is treated as 24 hours."
        maxWidthClassName="max-w-3xl"
      >
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setEditor({ mode: "new" })}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Add shift
            </button>
          </div>

          {shiftsQuery.isLoading ? (
            <div className="flex justify-center py-10 text-grey-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : shifts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-grey-200 px-3 py-10 text-center text-sm text-grey-500">
              No shifts yet — this site runs a full 24-hour day.
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-grey-200 bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-grey-200 text-xs uppercase tracking-wide text-grey-500">
                      <th className="px-4 py-3 font-medium">Shift</th>
                      <th className="px-4 py-3 font-medium">Applies to</th>
                      <th className="px-4 py-3 font-medium">Time</th>
                      <th className="px-4 py-3 font-medium">Cleaners</th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.map((shift) => (
                      <tr key={shift.id} className="border-b border-grey-100 last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Clock className="h-4 w-4 shrink-0 text-grey-400" />
                            <span className="font-medium text-on-surface">{shift.name}</span>
                            {shift.isDefault && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-ink">
                                <Star className="h-3 w-3" /> Default
                              </span>
                            )}
                            {shift.crossesMidnight && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-grey-100 px-2 py-0.5 text-xs font-medium text-grey-600">
                                <Moon className="h-3 w-3" /> Overnight
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-grey-700">
                          {shift.dayOfWeek ? DAY_LABELS[shift.dayOfWeek] : "All working days"}
                        </td>
                        <td className="px-4 py-3 text-grey-700">
                          {hhmm(shift.startTime)} – {hhmm(shift.endTime)}
                          {shift.crossesMidnight ? " (next day)" : ""}
                        </td>
                        <td className="px-4 py-3 text-grey-700">
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-grey-400" /> {cleanerCount(shift.id)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setViewing(shift)}
                              aria-label="View shift"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-primary/10 hover:text-ink"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditor({ mode: "edit", shift })}
                              aria-label="Edit shift"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-primary/10 hover:text-ink"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setAssigning(shift)}
                              aria-label="Assign cleaners"
                              title="Assign cleaners"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-primary/10 hover:text-ink"
                            >
                              <Users className="h-4 w-4" />
                            </button>
                            {!shift.isDefault && site && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => setDefault.mutate({ siteId: site.id, shiftId: shift.id })}
                                aria-label="Set as default shift"
                                title="Set as default"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-primary/10 hover:text-ink disabled:opacity-50"
                              >
                                <Star className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => setDeleting(shift)}
                              aria-label="Delete shift"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-error/10 hover:text-error disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </PanelOrModal>

      {site && editor && (
        <ShiftEditorModal
          site={site}
          shift={editor.mode === "edit" ? editor.shift : null}
          dayOptions={DAY_OF_WEEK_VALUES.filter((d) => (site.workingDays ?? []).includes(d))}
          onClose={() => setEditor(null)}
        />
      )}

      {site && assigning && (
        <ShiftCleanersModal
          site={site}
          shift={assigning}
          inHouseProfiles={inHouseProfiles}
          outsourceProfiles={outsourceProfiles}
          loading={profilesLoading}
          onClose={() => setAssigning(null)}
        />
      )}

      {site && viewing && (
        <ShiftViewModal
          shift={viewing}
          cleanerCount={cleanerCount(viewing.id)}
          inHouseProfiles={inHouseProfiles}
          outsourceProfiles={outsourceProfiles}
          onClose={() => setViewing(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete shift"
        description={`Delete "${deleting?.name}"? This cannot be undone.`}
        isPending={deleteShift.isPending}
        error={deleteShift.isError ? getErrorMessage(deleteShift.error) : undefined}
        onConfirm={confirmDelete}
        onClose={() => {
          setDeleting(null);
          deleteShift.reset();
        }}
      />
    </>
  );
}

interface ShiftEditorModalProps {
  site: Site;
  shift: Shift | null;
  dayOptions: readonly DayOfWeek[];
  onClose: () => void;
}

/** Add / edit a single shift's details in a popup dialog. */
function ShiftEditorModal({ site, shift, dayOptions, onClose }: ShiftEditorModalProps) {
  const createShift = useCreateShift();
  const updateShift = useUpdateShift();
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShiftFormInput>({
    resolver: zodResolver(ShiftFormSchema),
    defaultValues: shift
      ? {
          name: shift.name,
          startTime: hhmm(shift.startTime),
          endTime: hhmm(shift.endTime),
          dayOfWeek: shift.dayOfWeek ?? "",
          isDefault: false,
        }
      : EMPTY_SHIFT,
  });

  const submitting = createShift.isPending || updateShift.isPending;

  function onSubmit(values: ShiftFormInput) {
    setLocalError(null);
    const handlers = {
      onSuccess: onClose,
      onError: (e: unknown) => setLocalError(getErrorMessage(e)),
    };
    if (shift) {
      updateShift.mutate({ siteId: site.id, shiftId: shift.id, input: values }, handlers);
    } else {
      createShift.mutate({ siteId: site.id, input: values }, handlers);
    }
  }

  return (
    <Modal open onClose={onClose} title={shift ? "Edit shift" : "Add a shift"} maxWidthClassName="max-w-lg">
      <div className="flex flex-col gap-5">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="mb-1 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-ink">
              <Clock className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-semibold text-on-surface">Shift details</h3>
          </div>
          <TextField label="Shift name" placeholder="e.g. Night shift" error={errors.name?.message} {...register("name")} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField label="Start time" type="time" error={errors.startTime?.message} {...register("startTime")} />
            <TextField label="End time" type="time" error={errors.endTime?.message} {...register("endTime")} />
          </div>
          <label className="flex flex-col gap-1 text-sm text-on-surface">
            <span className="font-medium">Applies to</span>
            <select
              className="rounded-xl border border-grey-200 bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
              {...register("dayOfWeek")}
            >
              <option value="">All working days</option>
              {(dayOptions.length > 0 ? dayOptions : DAY_OF_WEEK_VALUES).map((d) => (
                <option key={d} value={d}>
                  {DAY_LABELS[d]}
                </option>
              ))}
            </select>
            <span className="text-xs text-grey-500">
              Shift times must fall within the site&apos;s general task window for the selected day(s).
            </span>
          </label>
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
          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-full border border-grey-300 px-4 py-2 text-sm font-semibold text-on-surface hover:bg-grey-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : shift ? (
                <Check className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {shift ? "Save changes" : "Add shift"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

interface ShiftCleanersModalProps {
  site: Site;
  shift: Shift;
  inHouseProfiles: SiteCleanerProfile[];
  outsourceProfiles: OutsourceCleanerProfile[];
  loading: boolean;
  onClose: () => void;
}

/** Dedicated popup to assign cleaners to a shift — separate from editing shift details. */
function ShiftCleanersModal({
  site,
  shift,
  inHouseProfiles,
  outsourceProfiles,
  loading,
  onClose,
}: ShiftCleanersModalProps) {
  return (
    <Modal open onClose={onClose} title={`Assign cleaners — ${shift.name}`} maxWidthClassName="max-w-lg">
      <ShiftCleanersPanel
        site={site}
        shift={shift}
        inHouseProfiles={inHouseProfiles}
        outsourceProfiles={outsourceProfiles}
        loading={loading}
        onDone={onClose}
      />
    </Modal>
  );
}

interface ShiftViewModalProps {
  shift: Shift;
  cleanerCount: number;
  inHouseProfiles: SiteCleanerProfile[];
  outsourceProfiles: OutsourceCleanerProfile[];
  onClose: () => void;
}

/** Read-only shift details and its assigned cleaners, in a popup. */
function ShiftViewModal({
  shift,
  cleanerCount,
  inHouseProfiles,
  outsourceProfiles,
  onClose,
}: ShiftViewModalProps) {
  const assignedInHouse = inHouseProfiles.filter((p) => p.shifts.some((s) => s.id === shift.id));
  const assignedOutsource = outsourceProfiles.filter((p) => p.shifts.some((s) => s.id === shift.id));

  return (
    <Modal open onClose={onClose} title={shift.name} maxWidthClassName="max-w-lg">
      <div className="flex flex-col gap-4">
        {(shift.isDefault || shift.crossesMidnight) && (
          <div className="flex flex-wrap gap-2">
            {shift.isDefault && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-ink">
                <Star className="h-3.5 w-3.5" /> Default shift
              </span>
            )}
            {shift.crossesMidnight && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
                <Moon className="h-3.5 w-3.5" /> Overnight
              </span>
            )}
          </div>
        )}

        <dl className="grid grid-cols-1 gap-3 rounded-2xl border border-grey-200 bg-surface p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-grey-500">Applies to</dt>
            <dd className="text-on-surface">{shift.dayOfWeek ? DAY_LABELS[shift.dayOfWeek] : "All working days"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-grey-500">Time window</dt>
            <dd className="text-on-surface">
              {hhmm(shift.startTime)} – {hhmm(shift.endTime)}
              {shift.crossesMidnight ? " (next day)" : ""}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-grey-500">Status</dt>
            <dd className="text-on-surface">{shift.isDefault ? "Default" : "Standard"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-grey-500">Cleaners assigned</dt>
            <dd className="text-on-surface">{cleanerCount}</dd>
          </div>
        </dl>

        <div className="rounded-2xl border border-grey-200 bg-surface p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-on-surface">
            <Users className="h-4 w-4 text-grey-500" /> Assigned cleaners
          </p>
          {cleanerCount === 0 ? (
            <p className="text-sm text-grey-500">No cleaners assigned to this shift yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {assignedInHouse.length > 0 && (
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-grey-500">In-house</p>
                  <div className="flex flex-wrap gap-1.5">
                    {assignedInHouse.map((p) => (
                      <span
                        key={p.id}
                        className="rounded-full border border-[#0B585A]/20 bg-[#0B585A]/5 px-2.5 py-1 text-xs text-on-surface"
                      >
                        {p.label}
                        {p.cleanerName ? ` · ${p.cleanerName}` : " · Unassigned"}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {assignedOutsource.length > 0 && (
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#ED5F25]">Outsource</p>
                  <div className="flex flex-wrap gap-1.5">
                    {assignedOutsource.map((p) => (
                      <span
                        key={p.id}
                        className="rounded-full border border-[#ED5F25]/20 bg-[#ED5F25]/5 px-2.5 py-1 text-xs text-on-surface"
                      >
                        {p.label}
                        {p.cleanerName ? ` · ${p.cleanerName}` : " · Unassigned"}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-grey-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-grey-300 px-4 py-2 text-sm font-semibold text-on-surface hover:bg-grey-100"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface ShiftCleanersPanelProps {
  site: Site;
  shift: Shift;
  inHouseProfiles: SiteCleanerProfile[];
  outsourceProfiles: OutsourceCleanerProfile[];
  loading: boolean;
  onDone: () => void;
}

/** Per-shift cleaner membership: pick which in-house/outsource slots work this shift. */
function ShiftCleanersPanel({
  site,
  shift,
  inHouseProfiles,
  outsourceProfiles,
  loading,
  onDone,
}: ShiftCleanersPanelProps) {
  const setCleaners = useSetShiftCleaners();
  const [inHouseSel, setInHouseSel] = useState<string[]>(() =>
    inHouseProfiles.filter((p) => p.shifts.some((s) => s.id === shift.id)).map((p) => p.id),
  );
  const [outsourceSel, setOutsourceSel] = useState<string[]>(() =>
    outsourceProfiles.filter((p) => p.shifts.some((s) => s.id === shift.id)).map((p) => p.id),
  );
  const [error, setError] = useState<string | null>(null);

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  function save() {
    setError(null);
    setCleaners.mutate(
      { siteId: site.id, shiftId: shift.id, inHouseProfileIds: inHouseSel, outsourceProfileIds: outsourceSel },
      { onSuccess: onDone, onError: (e) => setError(getErrorMessage(e)) },
    );
  }

  return (
    <div className="rounded-xl border border-grey-100 bg-grey-50/60 p-4">
      <p className="mb-3 text-sm font-medium text-grey-600">
        Cleaners working this shift — its tasks go only to the selected staff.
      </p>
      {loading ? (
        <p className="text-sm text-grey-500">Loading cleaners…</p>
      ) : inHouseProfiles.length === 0 && outsourceProfiles.length === 0 ? (
        <p className="text-sm text-grey-500">No cleaner slots on this site yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {inHouseProfiles.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-grey-500">In-house</p>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {inHouseProfiles.map((p) => (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-on-surface hover:bg-white"
                  >
                    <input
                      type="checkbox"
                      checked={inHouseSel.includes(p.id)}
                      onChange={() => toggle(inHouseSel, setInHouseSel, p.id)}
                      className="h-4 w-4 rounded border-grey-300 accent-[#0B585A]"
                    />
                    <span className="truncate">
                      {p.label}
                      {p.cleanerName ? ` · ${p.cleanerName}` : " · Unassigned"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {outsourceProfiles.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#ED5F25]">Outsource</p>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {outsourceProfiles.map((p) => (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-on-surface hover:bg-white"
                  >
                    <input
                      type="checkbox"
                      checked={outsourceSel.includes(p.id)}
                      onChange={() => toggle(outsourceSel, setOutsourceSel, p.id)}
                      className="h-4 w-4 rounded border-grey-300 accent-[#ED5F25]"
                    />
                    <span className="truncate">
                      {p.label}
                      {p.cleanerName ? ` · ${p.cleanerName}` : " · Unassigned"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
          {error}
        </p>
      )}
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={setCleaners.isPending || loading}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:opacity-90 disabled:opacity-50"
        >
          {setCleaners.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save cleaners
        </button>
      </div>
    </div>
  );
}
