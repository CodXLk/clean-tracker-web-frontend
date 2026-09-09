"use client";

import { useMemo, useState } from "react";
import { Handshake } from "lucide-react";
import { PanelOrModal } from "@/components/shared/PanelOrModal";
import { PillButton } from "@/components/shared/PillButton";
import { TextField } from "@/components/shared/TextField";
import { SearchableSelect, type SelectOption } from "@/features/user-management/components/SearchableSelect";
import { useSites } from "@/features/user-management/hooks/useSites";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import {
  useCreateOutsourceProject,
  useUpdateOutsourceProject,
} from "@/features/outsource/hooks/useOutsourceProjects";
import { type OutsourceProject } from "@/features/outsource/schemas/outsourceProject.schema";

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface OutsourceProjectModalProps {
  open: boolean;
  onClose: () => void;
  /** When provided the modal edits this project instead of creating a new one. */
  project?: OutsourceProject | null;
  onCreated?: (companyName: string) => void;
  onUpdated?: (companyName: string) => void;
  embedded?: boolean;
}

export function OutsourceProjectModal({
  open,
  onClose,
  project,
  onCreated,
  onUpdated,
  embedded,
}: OutsourceProjectModalProps) {
  const isEdit = !!project;
  const create = useCreateOutsourceProject();
  const update = useUpdateOutsourceProject();

  const [companyName, setCompanyName] = useState(project?.companyName ?? "");
  const [contactPersonName, setContactPersonName] = useState(project?.contactPersonName ?? "");
  const [contactNumber, setContactNumber] = useState(project?.contactNumber ?? "");
  const [siteId, setSiteId] = useState(project?.siteId ?? "");
  const [startDate, setStartDate] = useState(project?.startDate ?? toISODate(new Date()));
  const [endDate, setEndDate] = useState(project?.endDate ?? "");
  const [numberOfOutsourceCleaners, setNumberOfOutsourceCleaners] = useState(
    project?.numberOfOutsourceCleaners ?? 1,
  );
  const [numberOfOutsourceSupervisors, setNumberOfOutsourceSupervisors] = useState(
    project?.numberOfOutsourceSupervisors ?? 1,
  );
  const [formError, setFormError] = useState<string | null>(null);

  const pending = isEdit ? update.isPending : create.isPending;
  const mutationError = isEdit ? update.error : create.error;
  const isError = isEdit ? update.isError : create.isError;

  const sitesQuery = useSites();

  const siteOptions: SelectOption[] = useMemo(
    () =>
      (sitesQuery.data ?? []).map((s) => ({
        value: s.id,
        label: s.name,
        sublabel: s.siteType === "HOTEL" ? "Hotel" : undefined,
      })),
    [sitesQuery.data],
  );

  function resetAll() {
    setCompanyName("");
    setContactPersonName("");
    setContactNumber("");
    setSiteId("");
    setStartDate(toISODate(new Date()));
    setEndDate("");
    setNumberOfOutsourceCleaners(1);
    setNumberOfOutsourceSupervisors(1);
    setFormError(null);
    create.reset();
  }

  function handleClose() {
    if (pending) return;
    resetAll();
    onClose();
  }

  function validate(): string | null {
    if (!companyName.trim()) return "Enter the outsource company name.";
    if (!siteId) return "Select a site.";
    if (!startDate) return "Select a start date.";
    if (!endDate) return "Select an end date.";
    if (endDate < startDate) return "End date cannot be before the start date.";
    return null;
  }

  function handleSubmit() {
    const error = validate();
    if (error) {
      setFormError(error);
      return;
    }
    setFormError(null);

    const payload = {
      companyName: companyName.trim(),
      contactPersonName: contactPersonName.trim() || undefined,
      contactNumber: contactNumber.trim() || undefined,
      startDate,
      endDate,
      numberOfOutsourceCleaners,
      numberOfOutsourceSupervisors,
    };
    const name = companyName.trim();

    if (isEdit && project) {
      update.mutate(
        { id: project.id, input: payload },
        {
          onSuccess: () => {
            onUpdated?.(name);
            onClose();
          },
        },
      );
      return;
    }

    create.mutate(
      { ...payload, siteId },
      {
        onSuccess: () => {
          resetAll();
          onCreated?.(name);
          onClose();
        },
      },
    );
  }

  return (
    <PanelOrModal
      embedded={embedded}
      open={open}
      onClose={handleClose}
      title={isEdit ? "Edit outsource project" : "New outsource project"}
      description="Link a site to an external provider. Assign outsource cleaner and supervisor slots, then pick them when creating assignments."
      maxWidthClassName="max-w-2xl"
      embeddedMaxWidthClassName="w-full"
    >
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-grey-200 bg-surface p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
          <TextField
            label="Outsource company name"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
          <TextField
            label="Contact person"
            value={contactPersonName}
            onChange={(e) => setContactPersonName(e.target.value)}
          />
          <TextField
            label="Contact number"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
          />
          <SearchableSelect
            label="Site"
            required
            options={siteOptions}
            value={siteId}
            onChange={(value) => {
              if (isEdit) return;
              setSiteId(value);
            }}
            placeholder="Select a site"
            searchPlaceholder="Search sites…"
            emptyMessage="No sites"
            disabled={isEdit}
          />
          <TextField
            label="Start date"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <TextField
            label="End date"
            type="date"
            required
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="rounded-2xl border border-grey-200 bg-grey-50 p-4 sm:p-5">
          <p className="mb-3 text-xs text-grey-500">
            Set how many outsource cleaner and supervisor slots this project has. Assign the actual
            outsource staff to those slots from the project's actions.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="Outsource cleaner slots"
              type="number"
              min={0}
              max={100}
              value={String(numberOfOutsourceCleaners)}
              onChange={(e) => setNumberOfOutsourceCleaners(Math.max(0, Number(e.target.value) || 0))}
            />
            <TextField
              label="Outsource supervisor slots"
              type="number"
              min={0}
              max={100}
              value={String(numberOfOutsourceSupervisors)}
              onChange={(e) => setNumberOfOutsourceSupervisors(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
        </div>

        {(formError || isError) && (
          <p className="text-sm text-error">{formError ?? getErrorMessage(mutationError)}</p>
        )}

        <div className="mt-1 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={pending}
            className="rounded-full border border-grey-300 px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100 disabled:opacity-60"
          >
            Cancel
          </button>
          <PillButton
            type="button"
            variant="teal"
            onClick={handleSubmit}
            disabled={pending}
            className="w-auto px-6"
          >
            <span className="inline-flex items-center gap-2">
              <Handshake size={16} aria-hidden="true" />
              {isEdit
                ? pending
                  ? "Saving…"
                  : "Save changes"
                : pending
                  ? "Creating…"
                  : "Create project"}
            </span>
          </PillButton>
        </div>
      </div>
    </PanelOrModal>
  );
}
