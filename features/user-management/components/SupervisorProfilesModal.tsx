"use client";

import { useMemo, useState } from "react";
import { Plus, Minus } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { PillButton } from "@/components/shared/PillButton";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { SearchableSelect, type SelectOption } from "./SearchableSelect";
import {
  useSiteSupervisorProfiles,
  useAssignSupervisorProfiles,
  useAddSupervisorProfile,
  useRemoveSupervisorProfile,
  useEligibleSiteSupervisors,
  type SupervisorProfileAssignmentInput,
} from "@/features/user-management/hooks/useSiteAssignments";
import { useCertificateLabels } from "@/features/users/hooks/useCertificateTypes";
import { candidateCertMeta } from "@/features/users/components/CertificateBadge";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import type { Site, SiteSupervisorProfile } from "@/features/user-management/schemas/site.schema";

const UNASSIGNED = "";

function personName(first?: string | null, last?: string | null): string {
  return [first, last].filter(Boolean).join(" ").trim() || "Unnamed";
}

function profileLabel(p: SiteSupervisorProfile): string {
  return p.label || `Supervisor ${p.profileIndex}`;
}

interface SupervisorProfilesModalProps {
  open: boolean;
  onClose: () => void;
  site: Site | null;
}

export function SupervisorProfilesModal({ open, onClose, site }: SupervisorProfilesModalProps) {
  const profilesQuery = useSiteSupervisorProfiles(open ? site?.id : undefined);
  // Always list every active supervisor (with certificates); ineligible ones are view-only.
  const eligibleQuery = useEligibleSiteSupervisors(open ? site?.id : undefined, open);
  const certLabel = useCertificateLabels();
  const requiredKeys = useMemo(() => site?.requiredCertificates ?? [], [site?.requiredCertificates]);
  const assign = useAssignSupervisorProfiles();
  const addProfile = useAddSupervisorProfile();
  const removeProfile = useRemoveSupervisorProfile();

  // profileId -> selected supervisorId ("" = unassigned)
  const [selections, setSelections] = useState<Record<string, string>>({});

  const profiles = useMemo(
    () => [...(profilesQuery.data ?? [])].sort((a, b) => a.profileIndex - b.profileIndex),
    [profilesQuery.data],
  );
  // Sync local selections when the profiles load / modal opens / slots change.
  const loadedKey = useMemo(
    () => profiles.map((p) => `${p.id}:${p.supervisorId ?? ""}`).join("|"),
    [profiles],
  );
  const [syncedKey, setSyncedKey] = useState<string | null>(null);
  if (open && !profilesQuery.isLoading && loadedKey !== syncedKey) {
    setSyncedKey(loadedKey);
    setSelections(Object.fromEntries(profiles.map((p) => [p.id, p.supervisorId ?? UNASSIGNED])));
  }
  if (!open && syncedKey !== null) {
    setSyncedKey(null);
    setSelections({});
    assign.reset();
    addProfile.reset();
    removeProfile.reset();
  }

  const supervisorOptions: SelectOption[] = useMemo(() => {
    return [
      { value: UNASSIGNED, label: "— Unassigned —" },
      ...(eligibleQuery.data ?? []).map((u) => ({
        value: u.id,
        label: personName(u.firstName, u.lastName),
        sublabel: u.email ?? undefined,
        ...candidateCertMeta(requiredKeys, u.validCertificates ?? [], certLabel),
      })),
    ];
  }, [eligibleQuery.data, requiredKeys, certLabel]);

  const duplicateSupervisor = useMemo(() => {
    const counts = new Map<string, number>();
    for (const supervisorId of Object.values(selections)) {
      if (supervisorId) counts.set(supervisorId, (counts.get(supervisorId) ?? 0) + 1);
    }
    return [...counts.values()].some((n) => n > 1);
  }, [selections]);

  function handleSave() {
    if (!site || duplicateSupervisor) return;
    const payload: SupervisorProfileAssignmentInput[] = profiles.map((p) => ({
      profileId: p.id,
      supervisorId: selections[p.id] ? selections[p.id] : null,
    }));
    assign.mutate({ siteId: site.id, profiles: payload }, { onSuccess: onClose });
  }

  function handleAdd() {
    if (!site) return;
    removeProfile.reset();
    addProfile.mutate({ siteId: site.id });
  }

  function handleRemoveSlot(profileId: string) {
    if (!site) return;
    addProfile.reset();
    removeProfile.mutate({ siteId: site.id, profileId });
  }

  const busy = addProfile.isPending || removeProfile.isPending;
  const isLoading = profilesQuery.isLoading || eligibleQuery.isLoading;

  const title = "Supervisor slots";
  const description = site ? `Supervisor slots for “${site.name}”` : undefined;

  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-on-surface">
              {profiles.length} supervisor slot{profiles.length === 1 ? "" : "s"}
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

          {profiles.length === 0 ? (
            <p className="rounded-xl border border-dashed border-grey-200 px-3 py-6 text-center text-sm text-grey-500">
              No supervisor slots yet. Add one to assign a supervisor.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {profiles.map((p) => (
                <div key={p.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-on-surface">{profileLabel(p)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(p.id)}
                      disabled={busy || profiles.length <= 1}
                      aria-label={`Remove ${profileLabel(p)}`}
                      title={
                        profiles.length <= 1
                          ? "A site must keep at least one supervisor slot."
                          : undefined
                      }
                      className="inline-flex items-center gap-1 rounded-full border border-error px-2.5 py-1 text-xs font-semibold text-error transition-colors hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus size={12} aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                  <SearchableSelect
                    options={supervisorOptions}
                    value={selections[p.id] ?? UNASSIGNED}
                    onChange={(value) => setSelections((prev) => ({ ...prev, [p.id]: value }))}
                    placeholder="Assign a supervisor"
                    searchPlaceholder="Search supervisors…"
                    emptyMessage="No supervisors exist yet. Invite supervisors from User Management first."
                  />
                </div>
              ))}
            </div>
          )}

          {duplicateSupervisor && (
            <p className="text-sm text-error">A supervisor can only fill one slot on this site.</p>
          )}
          {(assign.isError || addProfile.isError || removeProfile.isError) && (
            <p className="text-sm text-error">
              {getErrorMessage(assign.error ?? addProfile.error ?? removeProfile.error)}
            </p>
          )}

          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={assign.isPending}
              className="rounded-full border border-grey-300 px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100 disabled:opacity-60"
            >
              Cancel
            </button>
            <PillButton
              type="button"
              variant="teal"
              onClick={handleSave}
              disabled={duplicateSupervisor || assign.isPending}
              className="w-auto px-6"
            >
              {assign.isPending ? "Saving…" : "Save"}
            </PillButton>
          </div>
        </div>
      )}
    </Modal>
  );
}
