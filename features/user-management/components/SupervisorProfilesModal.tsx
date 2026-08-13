"use client";

import { useMemo, useState } from "react";
import { Plus, Minus, ArrowLeft } from "lucide-react";
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
import { useUsers } from "@/features/users/hooks/useUsers";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import type { Site, SiteSupervisorProfile } from "@/features/user-management/schemas/site.schema";

const UNASSIGNED = "";

type View = "assign" | "add" | "remove";

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
  const requiresCerts = (site?.requiredCertificates?.length ?? 0) > 0;
  const usersQuery = useUsers();
  const eligibleQuery = useEligibleSiteSupervisors(
    open && requiresCerts ? site?.id : undefined,
    requiresCerts,
  );
  const assign = useAssignSupervisorProfiles();
  const addProfile = useAddSupervisorProfile();
  const removeProfile = useRemoveSupervisorProfile();

  const [view, setView] = useState<View>("assign");
  // profileId -> selected supervisorId ("" = unassigned)
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [removeTargetId, setRemoveTargetId] = useState<string>("");

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
    setView("assign");
    setRemoveTargetId("");
    assign.reset();
    addProfile.reset();
    removeProfile.reset();
  }

  const supervisorOptions: SelectOption[] = useMemo(() => {
    const people = requiresCerts
      ? (eligibleQuery.data ?? [])
      : (usersQuery.data ?? []).filter((u) => u.role === "SUPERVISOR");
    return [
      { value: UNASSIGNED, label: "— Unassigned —" },
      ...people.map((u) => ({
        value: u.id,
        label: personName(u.firstName, u.lastName),
        sublabel: u.email ?? undefined,
      })),
    ];
  }, [requiresCerts, eligibleQuery.data, usersQuery.data]);

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
    addProfile.mutate({ siteId: site.id }, { onSuccess: () => setView("assign") });
  }

  function handleRemove() {
    if (!site || !removeTargetId) return;
    removeProfile.mutate(
      { siteId: site.id, profileId: removeTargetId },
      {
        onSuccess: () => {
          setView("assign");
          setRemoveTargetId("");
        },
      },
    );
  }

  function openRemoveView() {
    setRemoveTargetId(profiles.length > 0 ? profiles[profiles.length - 1]!.id : "");
    removeProfile.reset();
    setView("remove");
  }

  const isLoading = profilesQuery.isLoading || usersQuery.isLoading;

  const title =
    view === "add"
      ? "Add a supervisor slot"
      : view === "remove"
        ? "Remove a supervisor slot"
        : "Supervisor slots";

  const description = site
    ? view === "assign"
      ? `Supervisor slots for “${site.name}”`
      : `“${site.name}”`
    : undefined;

  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : view === "add" ? (
        <div className="flex flex-col gap-4">
          <p className="rounded-xl bg-grey-50 px-3 py-2 text-xs text-grey-500">
            A new supervisor slot will be created for this site. You can place a supervisor in it
            afterwards.
          </p>
          {addProfile.isError && (
            <p className="text-sm text-error">{getErrorMessage(addProfile.error)}</p>
          )}
          <div className="mt-1 flex justify-between gap-2">
            <button
              type="button"
              onClick={() => setView("assign")}
              className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-on-surface hover:bg-grey-100"
            >
              <ArrowLeft size={16} aria-hidden="true" /> Back
            </button>
            <PillButton variant="teal" onClick={handleAdd} disabled={addProfile.isPending}>
              {addProfile.isPending ? "Adding…" : "Add slot"}
            </PillButton>
          </div>
        </div>
      ) : view === "remove" ? (
        <div className="flex flex-col gap-4">
          <p className="rounded-xl bg-grey-50 px-3 py-2 text-xs text-grey-500">
            Removing a slot unassigns its supervisor from this site. A site always keeps at least one
            supervisor slot.
          </p>
          <SearchableSelect
            label="Slot to remove"
            options={profiles.map((p) => ({
              value: p.id,
              label: profileLabel(p),
              sublabel: p.supervisorName ?? "Vacant",
            }))}
            value={removeTargetId}
            onChange={setRemoveTargetId}
            placeholder="Select a slot to remove"
            searchPlaceholder="Search slots…"
            emptyMessage="No slots"
          />
          {removeProfile.isError && (
            <p className="text-sm text-error">{getErrorMessage(removeProfile.error)}</p>
          )}
          <div className="mt-1 flex justify-between gap-2">
            <button
              type="button"
              onClick={() => setView("assign")}
              className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-on-surface hover:bg-grey-100"
            >
              <ArrowLeft size={16} aria-hidden="true" /> Back
            </button>
            <PillButton
              variant="orange"
              onClick={handleRemove}
              disabled={!removeTargetId || removeProfile.isPending}
            >
              {removeProfile.isPending ? "Removing…" : "Remove slot"}
            </PillButton>
          </div>
        </div>
      ) : (
        // ── Assign supervisors to slots ──────────────────────────────────────────
        <div className="flex flex-col gap-4">
          {profiles.length === 0 ? (
            <p className="py-6 text-center text-sm text-grey-500">No supervisor slots yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {profiles.map((p) => (
                <SearchableSelect
                  key={p.id}
                  label={profileLabel(p)}
                  options={supervisorOptions}
                  value={selections[p.id] ?? UNASSIGNED}
                  onChange={(value) => setSelections((prev) => ({ ...prev, [p.id]: value }))}
                  placeholder="Assign a supervisor"
                  searchPlaceholder="Search supervisors…"
                  emptyMessage="No supervisors exist yet. Invite supervisors from User Management first."
                />
              ))}
            </div>
          )}

          {duplicateSupervisor && (
            <p className="text-sm text-error">
              A supervisor can only fill one slot on this site.
            </p>
          )}
          {assign.isError && <p className="text-sm text-error">{getErrorMessage(assign.error)}</p>}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  addProfile.reset();
                  setView("add");
                }}
                className="flex items-center gap-1 rounded-full border border-grey-300 px-3 py-2 text-sm font-medium text-on-surface hover:bg-grey-100"
              >
                <Plus size={16} aria-hidden="true" /> Add slot
              </button>
              <button
                type="button"
                onClick={openRemoveView}
                disabled={profiles.length <= 1}
                className="flex items-center gap-1 rounded-full border border-grey-300 px-3 py-2 text-sm font-medium text-on-surface hover:bg-grey-100 disabled:opacity-50"
              >
                <Minus size={16} aria-hidden="true" /> Remove slot
              </button>
            </div>
            <PillButton
              variant="teal"
              onClick={handleSave}
              disabled={duplicateSupervisor || assign.isPending}
              className="!h-11 !w-auto !px-6"
            >
              {assign.isPending ? "Saving…" : "Save"}
            </PillButton>
          </div>
        </div>
      )}
    </Modal>
  );
}
