"use client";

import { useMemo, useState } from "react";
import { UserCog, Plus, Minus } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { PillButton } from "@/components/shared/PillButton";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { SearchableSelect, type SelectOption } from "@/features/user-management/components/SearchableSelect";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import {
  useOutsourceCleanerProfiles,
  useAssignOutsourceCleaners,
  useAddOutsourceCleanerProfile,
  useRemoveOutsourceCleanerProfile,
  useOutsourceSupervisorProfiles,
  useAssignOutsourceSupervisors,
  useAddOutsourceSupervisorProfile,
  useRemoveOutsourceSupervisorProfile,
  useEligibleOutsourceCleaners,
  useEligibleOutsourceSupervisors,
} from "@/features/outsource/hooks/useOutsourceProjects";
import type { OutsourceProject } from "@/features/outsource/schemas/outsourceProject.schema";

const UNASSIGNED = "";

function personName(first?: string | null, last?: string | null): string {
  return [first, last].filter(Boolean).join(" ").trim() || "Unnamed";
}

interface OutsourceProfilesModalProps {
  open: boolean;
  onClose: () => void;
  project: OutsourceProject | null;
  kind: "cleaner" | "supervisor";
}

export function OutsourceProfilesModal({ open, onClose, project, kind }: OutsourceProfilesModalProps) {
  const isCleaner = kind === "cleaner";
  const projectId = open ? project?.id : undefined;

  const cleanerProfilesQuery = useOutsourceCleanerProfiles(isCleaner ? projectId : undefined);
  const supervisorProfilesQuery = useOutsourceSupervisorProfiles(!isCleaner ? projectId : undefined);
  const eligibleCleaners = useEligibleOutsourceCleaners(open && isCleaner);
  const eligibleSupervisors = useEligibleOutsourceSupervisors(open && !isCleaner);

  const assignCleaners = useAssignOutsourceCleaners();
  const addCleaner = useAddOutsourceCleanerProfile();
  const removeCleaner = useRemoveOutsourceCleanerProfile();
  const assignSupervisors = useAssignOutsourceSupervisors();
  const addSupervisor = useAddOutsourceSupervisorProfile();
  const removeSupervisor = useRemoveOutsourceSupervisorProfile();

  const profilesQuery = isCleaner ? cleanerProfilesQuery : supervisorProfilesQuery;
  const eligibleQuery = isCleaner ? eligibleCleaners : eligibleSupervisors;
  const addMutation = isCleaner ? addCleaner : addSupervisor;
  const removeMutation = isCleaner ? removeCleaner : removeSupervisor;
  const assignMutation = isCleaner ? assignCleaners : assignSupervisors;

  const profiles = useMemo(
    () => [...(profilesQuery.data ?? [])].sort((a, b) => a.profileIndex - b.profileIndex),
    [profilesQuery.data],
  );

  const [selections, setSelections] = useState<Record<string, string>>({});
  const loadedKey = useMemo(
    () =>
      profiles
        .map((p) => `${p.id}:${(isCleaner ? (p as { cleanerId?: string | null }).cleanerId : (p as { supervisorId?: string | null }).supervisorId) ?? ""}`)
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
    if (!project || duplicate) return;
    const projectId = project.id;
    if (isCleaner) {
      const payload = profiles.map((p) => ({ profileId: p.id, cleanerId: selections[p.id] || null }));
      assignCleaners.mutate({ projectId, profiles: payload }, { onSuccess: onClose });
    } else {
      const payload = profiles.map((p) => ({ profileId: p.id, supervisorId: selections[p.id] || null }));
      assignSupervisors.mutate({ projectId, profiles: payload }, { onSuccess: onClose });
    }
  }

  function handleAdd() {
    if (!project) return;
    if (isCleaner) addCleaner.mutate({ projectId: project.id });
    else addSupervisor.mutate({ projectId: project.id });
  }

  function handleRemove(profileId: string) {
    if (!project) return;
    if (isCleaner) removeCleaner.mutate({ projectId: project.id, profileId });
    else removeSupervisor.mutate({ projectId: project.id, profileId });
  }

  const busy = addMutation.isPending || removeMutation.isPending;
  const noun = isCleaner ? "cleaner" : "supervisor";
  const title = `Outsource ${noun}s${project ? ` — ${project.companyName}` : ""}`;

  return (
    <Modal open={open} onClose={onClose} title={title} description={project?.siteName ?? undefined}>
      {profilesQuery.isLoading || eligibleQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="rounded-xl bg-grey-50 px-3 py-2 text-xs text-grey-500">
            Each slot holds one outsource {noun}. Assigned {noun}s are attached to every task in the
            project&apos;s scope.
          </p>

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
            {profiles.map((p) => (
              <div key={p.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-on-surface">{p.label}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(p.id)}
                    disabled={busy}
                    aria-label={`Remove ${p.label}`}
                    className="inline-flex items-center gap-1 rounded-full border border-grey-300 px-2.5 py-1 text-xs font-semibold text-on-surface transition-colors hover:bg-grey-100 disabled:opacity-60"
                  >
                    <Minus size={12} aria-hidden="true" />
                    Remove
                  </button>
                </div>
                <SearchableSelect
                  options={staffOptions}
                  value={selections[p.id] ?? UNASSIGNED}
                  onChange={(value) => setSelections((prev) => ({ ...prev, [p.id]: value }))}
                  placeholder={`Select an outsource ${noun}`}
                  searchPlaceholder={`Search outsource ${noun}s…`}
                  emptyMessage={`No outsource ${noun}s available`}
                />
              </div>
            ))}
            {profiles.length === 0 && (
              <p className="rounded-xl border border-dashed border-grey-200 px-3 py-6 text-center text-sm text-grey-500">
                No {noun} slots. Add one to assign an outsource {noun}.
              </p>
            )}
          </div>

          {duplicate && (
            <p className="text-sm text-error">The same {noun} cannot fill more than one slot.</p>
          )}
          {(assignMutation.isError || addMutation.isError || removeMutation.isError) && (
            <p className="text-sm text-error">
              {getErrorMessage(assignMutation.error ?? addMutation.error ?? removeMutation.error)}
            </p>
          )}

          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={assignMutation.isPending}
              className="rounded-full border border-grey-300 px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100 disabled:opacity-60"
            >
              Cancel
            </button>
            <PillButton
              type="button"
              variant="teal"
              onClick={handleSave}
              disabled={assignMutation.isPending || duplicate}
              className="w-auto px-6"
            >
              <span className="inline-flex items-center gap-2">
                <UserCog size={16} aria-hidden="true" />
                {assignMutation.isPending ? "Saving…" : "Save slots"}
              </span>
            </PillButton>
          </div>
        </div>
      )}
    </Modal>
  );
}
