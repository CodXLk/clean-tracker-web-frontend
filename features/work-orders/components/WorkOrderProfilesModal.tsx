"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { SearchableSelect, type SelectOption } from "@/features/user-management/components/SearchableSelect";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import {
  useWorkOrderCleanerProfiles,
  useAssignWorkOrderCleaners,
  useWorkOrderSupervisorProfiles,
  useAssignWorkOrderSupervisors,
  useEligibleWorkOrderCleaners,
  useEligibleWorkOrderSupervisors,
} from "@/features/work-orders/hooks/useWorkOrders";
import type { WorkOrder } from "@/features/work-orders/schemas/workOrder.schema";

const UNASSIGNED = "";

function personName(first?: string | null, last?: string | null): string {
  return [first, last].filter(Boolean).join(" ").trim() || "Unnamed";
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

  const cleanerProfilesQuery = useWorkOrderCleanerProfiles(isCleaner ? id : undefined);
  const supervisorProfilesQuery = useWorkOrderSupervisorProfiles(!isCleaner ? id : undefined);
  const eligibleCleaners = useEligibleWorkOrderCleaners(open && isCleaner);
  const eligibleSupervisors = useEligibleWorkOrderSupervisors(open && !isCleaner);

  const assignCleaners = useAssignWorkOrderCleaners();
  const assignSupervisors = useAssignWorkOrderSupervisors();

  const profilesQuery = isCleaner ? cleanerProfilesQuery : supervisorProfilesQuery;
  const eligibleQuery = isCleaner ? eligibleCleaners : eligibleSupervisors;
  const assignMutation = isCleaner ? assignCleaners : assignSupervisors;

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
  }

  const staffOptions: SelectOption[] = useMemo(() => {
    const base: SelectOption[] = [{ value: UNASSIGNED, label: "— Unassigned —" }];
    if (isCleaner) {
      for (const c of eligibleCleaners.data ?? []) {
        base.push({ value: c.id, label: personName(c.firstName, c.lastName), sublabel: c.email ?? undefined });
      }
    } else {
      for (const s of eligibleSupervisors.data ?? []) {
        base.push({ value: s.id, label: personName(s.firstName, s.lastName), sublabel: s.email ?? undefined });
      }
    }
    return base;
  }, [isCleaner, eligibleCleaners.data, eligibleSupervisors.data]);

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

          <div className="flex flex-col gap-3">
            {profiles.map((p) => (
              <div key={p.id} className="flex flex-col gap-1">
                <span className="text-sm font-medium text-on-surface">{p.label}</span>
                <SearchableSelect
                  options={staffOptions}
                  value={selections[p.id] ?? UNASSIGNED}
                  onChange={(value) => setSelections((prev) => ({ ...prev, [p.id]: value }))}
                  placeholder={`Select a ${noun}`}
                  searchPlaceholder={`Search ${noun}s…`}
                  emptyMessage={`No ${noun}s available`}
                />
              </div>
            ))}
            {profiles.length === 0 && (
              <p className="rounded-xl border border-dashed border-grey-200 px-3 py-6 text-center text-sm text-grey-500">
                No {noun} slots. Edit the work order to set the number of {noun}s.
              </p>
            )}
          </div>

          {duplicate && (
            <p className="text-sm font-medium text-error">
              A {noun} can only fill one slot — remove the duplicate selection.
            </p>
          )}
          {assignMutation.isError && (
            <p className="text-sm font-medium text-error">{getErrorMessage(assignMutation.error)}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-grey-300 px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={duplicate || assignMutation.isPending || profiles.length === 0}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {assignMutation.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
