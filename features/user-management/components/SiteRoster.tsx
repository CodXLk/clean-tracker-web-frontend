"use client";

import { useMemo, useState, type ComponentType } from "react";
import { Plus, UserCog, Users, X } from "lucide-react";
import { InitialsAvatar } from "@/components/shared/InitialsAvatar";
import { CleanerProfilesModal } from "./CleanerProfilesModal";
import { SupervisorProfilesModal } from "./SupervisorProfilesModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import {
  useSiteCleanerProfiles,
  useSiteSupervisorProfiles,
  useAssignCleanerProfiles,
  useAssignSupervisorProfiles,
} from "@/features/user-management/hooks/useSiteAssignments";
import type { Site } from "@/features/user-management/schemas/site.schema";

interface RosterEntry {
  id: string;
  label: string;
  personName: string | null;
}

interface SiteRosterProps {
  site: Site | null;
  /** Supervisors may reassign cleaners but not change slots or the supervisor roster. */
  canManageSupervisors?: boolean;
  restrictCleanerSlots?: boolean;
}

/** Assigned cleaners (by profile) and supervisors for the selected site, shown as
 *  avatar badges with inline add/remove — mirrors the Site Management modals. */
export function SiteRoster({
  site,
  canManageSupervisors = true,
  restrictCleanerSlots = false,
}: SiteRosterProps) {
  const siteId = site?.id;
  const cleanerProfilesQuery = useSiteCleanerProfiles(siteId);
  const supervisorProfilesQuery = useSiteSupervisorProfiles(siteId);
  const assignCleaners = useAssignCleanerProfiles();
  const assignSupervisors = useAssignSupervisorProfiles();

  const [cleanersOpen, setCleanersOpen] = useState(false);
  const [supervisorsOpen, setSupervisorsOpen] = useState(false);
  // A pending unassign awaiting confirmation — the actual removal runs task cleanup
  // and notifications on the backend, so it must be intentional.
  const [removing, setRemoving] = useState<{
    type: "cleaner" | "supervisor";
    profileId: string;
    name: string;
    label: string;
  } | null>(null);

  const cleanerProfiles = useMemo(
    () => [...(cleanerProfilesQuery.data ?? [])].sort((a, b) => a.profileIndex - b.profileIndex),
    [cleanerProfilesQuery.data],
  );
  const supervisorProfiles = useMemo(
    () => [...(supervisorProfilesQuery.data ?? [])].sort((a, b) => a.profileIndex - b.profileIndex),
    [supervisorProfilesQuery.data],
  );

  if (!site) return null;

  function handleConfirmRemove() {
    if (!removing || !siteId) return;
    if (removing.type === "cleaner") {
      assignCleaners.mutate(
        {
          siteId,
          profiles: cleanerProfiles.map((p) => ({
            profileId: p.id,
            cleanerId: p.id === removing.profileId ? null : p.cleanerId ?? null,
          })),
        },
        { onSuccess: () => setRemoving(null) },
      );
    } else {
      assignSupervisors.mutate(
        {
          siteId,
          profiles: supervisorProfiles.map((p) => ({
            profileId: p.id,
            supervisorId: p.id === removing.profileId ? null : p.supervisorId ?? null,
          })),
        },
        { onSuccess: () => setRemoving(null) },
      );
    }
  }

  function closeRemove() {
    if (assignCleaners.isPending || assignSupervisors.isPending) return;
    assignCleaners.reset();
    assignSupervisors.reset();
    setRemoving(null);
  }

  const removeMutation = removing?.type === "supervisor" ? assignSupervisors : assignCleaners;
  const removeDescription = removing
    ? removing.type === "cleaner"
      ? `${removing.name} will be unassigned from “${removing.label}”. Their tasks for this site will be removed and ${removing.name} will be notified. If you assign a new cleaner to this slot, that cleaner will be notified of their tasks.`
      : `${removing.name} will be removed from “${removing.label}” and notified of the change.`
    : "";

  return (
    <div className="mb-6 rounded-2xl border border-line bg-white p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
      <RosterGroup
        title="Cleaners"
        icon={Users}
        canManage
        isLoading={cleanerProfilesQuery.isLoading}
        emptyLabel="No cleaner slots for this site yet."
        entries={cleanerProfiles.map((p) => ({
          id: p.id,
          label: p.label || `Cleaner ${p.profileIndex}`,
          personName: p.cleanerName ?? null,
        }))}
        onManage={() => setCleanersOpen(true)}
        onRemoveRequest={(entry) =>
          setRemoving({ type: "cleaner", profileId: entry.id, name: entry.personName ?? "", label: entry.label })
        }
      />

      <RosterGroup
        title="Supervisor"
        icon={UserCog}
        canManage={canManageSupervisors}
        isLoading={supervisorProfilesQuery.isLoading}
        emptyLabel="No supervisor slots for this site yet."
        entries={supervisorProfiles.map((p) => ({
          id: p.id,
          label: p.label || `Supervisor ${p.profileIndex}`,
          personName: p.supervisorName ?? null,
        }))}
        onManage={() => setSupervisorsOpen(true)}
        onRemoveRequest={(entry) =>
          setRemoving({ type: "supervisor", profileId: entry.id, name: entry.personName ?? "", label: entry.label })
        }
      />
      </div>

      <CleanerProfilesModal
        open={cleanersOpen}
        onClose={() => setCleanersOpen(false)}
        site={site}
        restrictToAssignOnly={restrictCleanerSlots}
      />
      <SupervisorProfilesModal
        open={supervisorsOpen}
        onClose={() => setSupervisorsOpen(false)}
        site={site}
      />

      <ConfirmDialog
        open={removing !== null}
        title={removing ? `Remove ${removing.name}?` : ""}
        description={removeDescription}
        confirmLabel="Remove"
        isPending={removeMutation.isPending}
        error={removeMutation.isError ? getErrorMessage(removeMutation.error) : undefined}
        onConfirm={handleConfirmRemove}
        onClose={closeRemove}
      />
    </div>
  );
}

function RosterGroup({
  title,
  icon: Icon,
  entries,
  isLoading,
  emptyLabel,
  canManage,
  onManage,
  onRemoveRequest,
}: {
  title: string;
  icon: ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;
  entries: RosterEntry[];
  isLoading: boolean;
  emptyLabel: string;
  canManage: boolean;
  onManage: () => void;
  onRemoveRequest: (entry: RosterEntry) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-2 text-sm font-medium text-ink">
          <Icon size={16} className="text-body-2" aria-hidden />
          {title}
        </span>
        {canManage && (
          <button
            type="button"
            onClick={onManage}
            className="rounded-full border border-brand-2 px-3 py-0.5 text-xs font-medium text-ink transition-colors hover:bg-brand-2/10"
          >
            Manage
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-xs text-body-2">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-xs text-body-2">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {entries.map((entry) =>
            entry.personName ? (
              <li
                key={entry.id}
                className="flex items-center gap-2 rounded-full border border-line bg-surface-muted py-1 pl-1 pr-1.5"
              >
                <InitialsAvatar name={entry.personName} size={28} />
                <span className="flex flex-col leading-tight">
                  <span className="text-[11px] text-body-2">{entry.label}</span>
                  <span className="text-xs font-medium text-ink">{entry.personName}</span>
                </span>
                {canManage && (
                  <button
                    type="button"
                    aria-label={`Remove ${entry.personName} from ${entry.label}`}
                    onClick={() => onRemoveRequest(entry)}
                    className="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-body-2 transition-colors hover:bg-line hover:text-ink"
                  >
                    <X size={12} aria-hidden />
                  </button>
                )}
              </li>
            ) : (
              <li key={entry.id}>
                <button
                  type="button"
                  disabled={!canManage}
                  onClick={onManage}
                  className="flex items-center gap-2 rounded-full border border-dashed border-line-2 py-1 pl-1 pr-3 text-xs text-body-2 transition-colors hover:border-brand-2 hover:text-brand-2 disabled:cursor-default disabled:hover:border-line-2 disabled:hover:text-body-2"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-current">
                    <Plus size={13} aria-hidden />
                  </span>
                  {entry.label}
                </button>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
