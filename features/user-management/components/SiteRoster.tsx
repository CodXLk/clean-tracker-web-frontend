"use client";

import { useMemo, useState, type ComponentType } from "react";
import { Plus, UserCog, Users, X, ChevronDown, ChevronRight } from "lucide-react";
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
import { useSiteOutsourceProjects } from "@/features/outsource/hooks/useOutsourceProjects";
import { OutsourceProfilesModal } from "@/features/outsource/components/OutsourceProfilesModal";
import { useSiteWorkOrders } from "@/features/work-orders/hooks/useWorkOrders";
import { WorkOrderProfilesModal } from "@/features/work-orders/components/WorkOrderProfilesModal";
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
  const [outsourceManage, setOutsourceManage] = useState<"cleaner" | "supervisor" | null>(null);
  const [workOrderManage, setWorkOrderManage] = useState<"cleaner" | "supervisor" | null>(null);
  const [selectedOutsourceId, setSelectedOutsourceId] = useState<string>("");
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string>("");
  // Each roster section collapses independently; all expanded by default.
  const [outsourceOpen, setOutsourceOpen] = useState(true);
  const [workOrderOpen, setWorkOrderOpen] = useState(true);
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

  const { projects: outsourceProjects } = useSiteOutsourceProjects(siteId);
  const { workOrders: siteWorkOrders } = useSiteWorkOrders(siteId);

  // Keep the selected project/work-order valid as the lists load or change.
  const outsourceProject = useMemo(
    () => outsourceProjects.find((p) => p.id === selectedOutsourceId) ?? outsourceProjects[0] ?? null,
    [outsourceProjects, selectedOutsourceId],
  );
  const workOrder = useMemo(
    () => siteWorkOrders.find((w) => w.id === selectedWorkOrderId) ?? siteWorkOrders[0] ?? null,
    [siteWorkOrders, selectedWorkOrderId],
  );
  const outsourceCleaners = useMemo(
    () => [...(outsourceProject?.cleanerProfiles ?? [])].sort((a, b) => a.profileIndex - b.profileIndex),
    [outsourceProject],
  );
  const outsourceSupervisors = useMemo(
    () => [...(outsourceProject?.supervisorProfiles ?? [])].sort((a, b) => a.profileIndex - b.profileIndex),
    [outsourceProject],
  );
  const workOrderCleaners = useMemo(
    () => [...(workOrder?.cleanerProfiles ?? [])].sort((a, b) => a.profileIndex - b.profileIndex),
    [workOrder],
  );
  const workOrderSupervisors = useMemo(
    () => [...(workOrder?.supervisorProfiles ?? [])].sort((a, b) => a.profileIndex - b.profileIndex),
    [workOrder],
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

      {outsourceProjects.length > 0 && outsourceProject && (
        <div
          className={`mt-5 border-t border-line pt-5 ${outsourceOpen ? "" : "cursor-pointer"}`}
          onClick={() => { if (!outsourceOpen) setOutsourceOpen(true); }}
        >
          <div
            className="mb-3 flex w-full cursor-pointer flex-wrap items-center justify-between gap-2"
            onClick={() => setOutsourceOpen((v) => !v)}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-body-2">Outsourced</span>
              <select
                aria-label="Select outsource project"
                value={outsourceProject.id}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setSelectedOutsourceId(e.target.value)}
                className="rounded-lg border border-grey-300 bg-white px-2.5 py-1.5 text-xs font-medium text-on-surface outline-none focus:border-primary"
              >
                {outsourceProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.companyName}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setOutsourceOpen((v) => !v); }}
              aria-expanded={outsourceOpen}
              aria-label={outsourceOpen ? "Collapse outsource section" : "Expand outsource section"}
              className="text-body-2"
            >
              {outsourceOpen ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
            </button>
          </div>
          {outsourceOpen && (
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
            <RosterGroup
              title="Outsource cleaners"
              icon={Users}
              canManage
              isLoading={false}
              emptyLabel="No outsource cleaner slots."
              entries={outsourceCleaners.map((p) => ({
                id: p.id,
                label: p.label || `Outsource Cleaner ${p.profileIndex}`,
                personName: p.cleanerName ?? null,
              }))}
              onManage={() => setOutsourceManage("cleaner")}
              onRemoveRequest={() => setOutsourceManage("cleaner")}
            />
            <RosterGroup
              title="Outsource supervisors"
              icon={UserCog}
              canManage
              isLoading={false}
              emptyLabel="No outsource supervisor slots."
              entries={outsourceSupervisors.map((p) => ({
                id: p.id,
                label: p.label || `Outsource Supervisor ${p.profileIndex}`,
                personName: p.supervisorName ?? null,
              }))}
              onManage={() => setOutsourceManage("supervisor")}
              onRemoveRequest={() => setOutsourceManage("supervisor")}
            />
          </div>
          )}
        </div>
      )}

      {siteWorkOrders.length > 0 && workOrder && (
        <div
          className={`mt-5 border-t border-line pt-5 ${workOrderOpen ? "" : "cursor-pointer"}`}
          onClick={() => { if (!workOrderOpen) setWorkOrderOpen(true); }}
        >
          <div
            className="mb-3 flex w-full cursor-pointer flex-wrap items-center justify-between gap-2"
            onClick={() => setWorkOrderOpen((v) => !v)}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-body-2">Work order</span>
              <select
                aria-label="Select work order"
                value={workOrder.id}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setSelectedWorkOrderId(e.target.value)}
                className="rounded-lg border border-grey-300 bg-white px-2.5 py-1.5 text-xs font-medium text-on-surface outline-none focus:border-primary"
              >
                {siteWorkOrders.map((w) => (
                  <option key={w.id} value={w.id}>
                    PO {w.poId}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setWorkOrderOpen((v) => !v); }}
              aria-expanded={workOrderOpen}
              aria-label={workOrderOpen ? "Collapse work order section" : "Expand work order section"}
              className="text-body-2"
            >
              {workOrderOpen ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
            </button>
          </div>
          {workOrderOpen && (
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
            <RosterGroup
              title="Work order cleaners"
              icon={Users}
              canManage
              isLoading={false}
              emptyLabel="No work order cleaner slots."
              entries={workOrderCleaners.map((p) => ({
                id: p.id,
                label: p.label || `Work Order Cleaner ${p.profileIndex}`,
                personName: p.cleanerName ?? null,
              }))}
              onManage={() => setWorkOrderManage("cleaner")}
              onRemoveRequest={() => setWorkOrderManage("cleaner")}
            />
            <RosterGroup
              title="Work order supervisors"
              icon={UserCog}
              canManage
              isLoading={false}
              emptyLabel="No work order supervisor slots."
              entries={workOrderSupervisors.map((p) => ({
                id: p.id,
                label: p.label || `Work Order Supervisor ${p.profileIndex}`,
                personName: p.supervisorName ?? null,
              }))}
              onManage={() => setWorkOrderManage("supervisor")}
              onRemoveRequest={() => setWorkOrderManage("supervisor")}
            />
          </div>
          )}
        </div>
      )}

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

      <OutsourceProfilesModal
        open={outsourceManage !== null}
        onClose={() => setOutsourceManage(null)}
        project={outsourceProject}
        kind={outsourceManage ?? "cleaner"}
      />

      <WorkOrderProfilesModal
        open={workOrderManage !== null}
        onClose={() => setWorkOrderManage(null)}
        workOrder={workOrder}
        kind={workOrderManage ?? "cleaner"}
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
