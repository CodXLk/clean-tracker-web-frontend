"use client";

import { useMemo, useState } from "react";
import { UserCog, Plus, Minus } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { PillButton } from "@/components/shared/PillButton";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { SearchableSelect, type SelectOption } from "@/features/user-management/components/SearchableSelect";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useCertificateLabels } from "@/features/users/hooks/useCertificateTypes";
import { candidateCertMeta } from "@/features/users/components/CertificateBadge";
import {
  useWorkOrderCleanerProfiles,
  useAssignWorkOrderCleaners,
  useAddWorkOrderCleanerProfile,
  useRemoveWorkOrderCleanerProfile,
  useWorkOrderSupervisorProfiles,
  useAssignWorkOrderSupervisors,
  useAddWorkOrderSupervisorProfile,
  useRemoveWorkOrderSupervisorProfile,
  useEligibleWorkOrderCleaners,
  useEligibleWorkOrderSupervisors,
} from "@/features/work-orders/hooks/useWorkOrders";
import type { WorkOrder } from "@/features/work-orders/schemas/workOrder.schema";

const UNASSIGNED = "";

function personName(first?: string | null, last?: string | null): string {
  return [first, last].filter(Boolean).join(" ").trim() || "Unnamed";
}

function taskCountOf(p: { taskCount?: number | null }): number {
  return p.taskCount ?? 0;
}

interface WorkOrderProfilesModalProps {
  open: boolean;
  onClose: () => void;
  workOrder: WorkOrder | null;
  kind: "cleaner" | "supervisor";
}

export function WorkOrderProfilesModal({ open, onClose, workOrder, kind }: WorkOrderProfilesModalProps) {
  const isCleaner = kind === "cleaner";
  const id = open ? workOrder?.id : undefined;
  const certLabel = useCertificateLabels();

  const cleanerProfilesQuery = useWorkOrderCleanerProfiles(isCleaner ? id : undefined);
  const supervisorProfilesQuery = useWorkOrderSupervisorProfiles(!isCleaner ? id : undefined);
  const eligibleCleaners = useEligibleWorkOrderCleaners(open && isCleaner);
  const eligibleSupervisors = useEligibleWorkOrderSupervisors(open && !isCleaner);

  const assignCleaners = useAssignWorkOrderCleaners();
  const addCleaner = useAddWorkOrderCleanerProfile();
  const removeCleaner = useRemoveWorkOrderCleanerProfile();
  const assignSupervisors = useAssignWorkOrderSupervisors();
  const addSupervisor = useAddWorkOrderSupervisorProfile();
  const removeSupervisor = useRemoveWorkOrderSupervisorProfile();

  const profilesQuery = isCleaner ? cleanerProfilesQuery : supervisorProfilesQuery;
  const eligibleQuery = isCleaner ? eligibleCleaners : eligibleSupervisors;
  const assignMutation = isCleaner ? assignCleaners : assignSupervisors;
  const addMutation = isCleaner ? addCleaner : addSupervisor;
  const removeMutation = isCleaner ? removeCleaner : removeSupervisor;

  const profiles = useMemo(
    () => [...(profilesQuery.data ?? [])].sort((a, b) => a.profileIndex - b.profileIndex),
    [profilesQuery.data],
  );

  const [selections, setSelections] = useState<Record<string, string>>({});
  const loadedKey = useMemo(
    () =>
      profiles
        .map(
          (p) =>
            `${p.id}:${(isCleaner ? (p as { cleanerId?: string | null }).cleanerId : (p as { supervisorId?: string | null }).supervisorId) ?? ""}`,
        )
        .join("|"),
    [profiles, isCleaner],
  );
  const [syncedKey, setSyncedKey] = useState<string | null>(null);
  if (open && !profilesQuery.isLoading && loadedKey !== syncedKey) {
    setSyncedKey(loadedKey);
    setSelections(
      Object.fromEntries(
        profiles.map((p) => [
          p.id,
          (isCleaner
            ? (p as { cleanerId?: string | null }).cleanerId
            : (p as { supervisorId?: string | null }).supervisorId) ?? UNASSIGNED,
        ]),
      ),
    );
  }
  if (!open && syncedKey !== null) {
    setSyncedKey(null);
    setSelections({});
    assignMutation.reset();
    addMutation.reset();
    removeMutation.reset();
  }

  const staffOptions: SelectOption[] = useMemo(() => {
    const base: SelectOption[] = [{ value: UNASSIGNED, label: "— Unassigned —" }];
    // Every work-order worker must hold the all-workers certificates.
    const requiredKeys = workOrder?.requiredCertificatesAllWorkers ?? [];
    if (isCleaner) {
      for (const c of eligibleCleaners.data ?? []) {
        base.push({
          value: c.id,
          label: personName(c.firstName, c.lastName),
          sublabel: c.email ?? undefined,
          ...candidateCertMeta(requiredKeys, c.validCertificates ?? [], certLabel),
        });
      }
    } else {
      for (const s of eligibleSupervisors.data ?? []) {
        base.push({
          value: s.id,
          label: personName(s.firstName, s.lastName),
          sublabel: s.email ?? undefined,
          ...candidateCertMeta(requiredKeys, s.validCertificates ?? [], certLabel),
        });
      }
    }
    return base;
  }, [isCleaner, eligibleCleaners.data, eligibleSupervisors.data, workOrder?.requiredCertificatesAllWorkers, certLabel]);

  const duplicate = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of Object.values(selections)) {
      if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    return [...counts.values()].some((n) => n > 1);
  }, [selections]);

  function handleSave() {
    if (!workOrder || duplicate) return;
    if (isCleaner) {
      const payload = profiles.map((p) => ({ profileId: p.id, cleanerId: selections[p.id] || null }));
      assignCleaners.mutate({ id: workOrder.id, profiles: payload }, { onSuccess: onClose });
    } else {
      const payload = profiles.map((p) => ({ profileId: p.id, supervisorId: selections[p.id] || null }));
      assignSupervisors.mutate({ id: workOrder.id, profiles: payload }, { onSuccess: onClose });
    }
  }

  function handleAdd() {
    if (!workOrder) return;
    removeMutation.reset();
    if (isCleaner) addCleaner.mutate({ id: workOrder.id });
    else addSupervisor.mutate({ id: workOrder.id });
  }

  function handleRemove(profileId: string) {
    if (!workOrder) return;
    addMutation.reset();
    if (isCleaner) removeCleaner.mutate({ id: workOrder.id, profileId });
    else removeSupervisor.mutate({ id: workOrder.id, profileId });
  }

  const busy = addMutation.isPending || removeMutation.isPending;
  const noun = isCleaner ? "cleaner" : "supervisor";
  const title = `Work order ${noun}s${workOrder ? ` — ${workOrder.poId}` : ""}`;

  return (
    <Modal open={open} onClose={onClose} title={title} description={workOrder?.siteName ?? undefined}>
      {profilesQuery.isLoading || eligibleQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="rounded-xl bg-grey-50 px-3 py-2 text-xs text-grey-500">
            Each slot holds one {noun}. Assigned {noun}s are attached to every task added to this work
            order, so they see it on the day.
          </p>

          {((workOrder?.requiredCertificatesAllWorkers?.length ?? 0) > 0 ||
            (workOrder?.requiredCertificatesAnyWorker?.length ?? 0) > 0) && (
            <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
              <span className="font-semibold">Certificate requirements</span>
              {(workOrder?.requiredCertificatesAllWorkers?.length ?? 0) > 0 && (
                <p>
                  <span className="font-medium">Every worker</span> must hold:{" "}
                  {workOrder!.requiredCertificatesAllWorkers
                    .map((c) => certLabel(c))
                    .join(", ")}
                  .
                </p>
              )}
              {(workOrder?.requiredCertificatesAnyWorker?.length ?? 0) > 0 && (
                <p>
                  <span className="font-medium">At least one worker</span> (cleaner or supervisor) must hold:{" "}
                  {workOrder!.requiredCertificatesAnyWorker
                    .map((c) => certLabel(c))
                    .join(", ")}
                  .
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-on-surface">
              {profiles.length} {noun} slot{profiles.length === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={handleAdd}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full border border-teal-500 px-3 py-1.5 text-xs font-semibold text-teal-600 transition-colors hover:bg-teal-50 disabled:opacity-60"
            >
              <Plus size={14} aria-hidden="true" />
              Add slot
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {profiles.map((p) => {
              const count = taskCountOf(p);
              const hasTasks = count > 0;
              return (
                <div key={p.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-on-surface">{p.label}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          hasTasks ? "bg-teal-50 text-teal-700" : "bg-grey-100 text-grey-500"
                        }`}
                      >
                        {hasTasks ? `${count} task${count === 1 ? "" : "s"}` : "No tasks"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(p.id)}
                      disabled={busy || hasTasks}
                      aria-label={`Remove ${p.label}`}
                      title={
                        hasTasks
                          ? "Tasks are assigned to this profile. Remove the tasks first, then delete the profile."
                          : undefined
                      }
                      className="inline-flex items-center gap-1 rounded-full border border-error px-2.5 py-1 text-xs font-semibold text-error transition-colors hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus size={12} aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                  <SearchableSelect
                    options={staffOptions}
                    value={selections[p.id] ?? UNASSIGNED}
                    onChange={(value) => setSelections((prev) => ({ ...prev, [p.id]: value }))}
                    placeholder={`Select a ${noun}`}
                    searchPlaceholder={`Search ${noun}s…`}
                    emptyMessage={`No ${noun}s available`}
                  />
                  {hasTasks && (
                    <p className="text-[11px] text-grey-500">
                      Tasks are assigned to this profile. Remove the tasks first, then delete the profile.
                    </p>
                  )}
                </div>
              );
            })}
            {profiles.length === 0 && (
              <p className="rounded-xl border border-dashed border-grey-200 px-3 py-6 text-center text-sm text-grey-500">
                No {noun} slots. Add one to assign a {noun}.
              </p>
            )}
          </div>

          {duplicate && (
            <p className="text-sm font-medium text-error">
              A {noun} can only fill one slot — remove the duplicate selection.
            </p>
          )}
          {(assignMutation.isError || addMutation.isError || removeMutation.isError) && (
            <p className="text-sm font-medium text-error">
              {getErrorMessage(assignMutation.error ?? addMutation.error ?? removeMutation.error)}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-grey-300 px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100"
            >
              Cancel
            </button>
            <PillButton
              type="button"
              variant="teal"
              onClick={handleSave}
              disabled={duplicate || assignMutation.isPending || profiles.length === 0}
              className="w-auto px-6"
            >
              <span className="inline-flex items-center gap-2">
                <UserCog size={16} aria-hidden="true" />
                {assignMutation.isPending ? "Saving…" : "Save"}
              </span>
            </PillButton>
          </div>
        </div>
      )}
    </Modal>
  );
}
