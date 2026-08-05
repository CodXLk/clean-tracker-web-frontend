"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Plus, Pencil, Trash2, UserCog, Users } from "lucide-react";
import { SearchInput } from "@/components/shared/SearchInput";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { DataTable, type Column } from "./DataTable";
import { RowMenu } from "./RowMenu";
import { ConfirmDialog } from "./ConfirmDialog";
import { SiteFormModal } from "./SiteFormModal";
import { WorkingDaysSelector } from "./WorkingDaysSelector";
import { AssignPeopleModal, type AssignOption } from "./AssignPeopleModal";
import { CleanerProfilesModal } from "./CleanerProfilesModal";
import { useSites, useDeleteSite } from "@/features/user-management/hooks/useSites";
import {
  useSiteSupervisors,
  useAssignSupervisors,
} from "@/features/user-management/hooks/useSiteAssignments";
import { useUsers } from "@/features/users/hooks/useUsers";
import type { Site } from "@/features/user-management/schemas/site.schema";

function personName(first?: string | null, last?: string | null): string {
  return [first, last].filter(Boolean).join(" ").trim() || "Unnamed";
}

export function SiteManagement() {
  const query = useSites();
  const deleteMutation = useDeleteSite();

  const usersQuery = useUsers();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Site | null>(null);
  const [deleting, setDeleting] = useState<Site | null>(null);
  const [supervisorsSite, setSupervisorsSite] = useState<Site | null>(null);
  const [cleanersSite, setCleanersSite] = useState<Site | null>(null);

  const siteSupervisors = useSiteSupervisors(supervisorsSite?.id);
  const assignSupervisors = useAssignSupervisors();

  const supervisorOptions: AssignOption[] = useMemo(
    () =>
      (usersQuery.data ?? [])
        .filter((u) => u.role === "SUPERVISOR")
        .map((u) => ({ id: u.id, label: personName(u.firstName, u.lastName), sublabel: u.email })),
    [usersQuery.data],
  );

  const rows = useMemo(() => {
    const list = query.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.clientCompanyName.toLowerCase().includes(q) ||
        s.clientName.toLowerCase().includes(q) ||
        (s.contactPersonName ?? "").toLowerCase().includes(q) ||
        (s.streetAddress ?? "").toLowerCase().includes(q),
    );
  }, [query.data, search]);

  const columns: Column<Site>[] = [
    {
      header: "Site",
      sortAccessor: (s) => s.name.toLowerCase(),
      cell: (s) => (
        <div>
          <span className="font-medium text-on-surface">{s.name}</span>
          {s.streetAddress && <span className="block text-xs text-grey-500">{s.streetAddress}</span>}
        </div>
      ),
    },
    {
      header: "Client-company",
      sortAccessor: (s) => s.clientCompanyName.toLowerCase(),
      cell: (s) => (
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          {s.clientCompanyName}
        </span>
      ),
    },
    {
      header: "Client",
      sortAccessor: (s) => s.clientName.toLowerCase(),
      cell: (s) => s.clientName,
    },
    {
      header: "Contact",
      sortAccessor: (s) => s.contactPersonName ?? "",
      cell: (s) => (
        <div>
          <span className="text-on-surface">{s.contactPersonName ?? "—"}</span>
          {s.contactNumber && <span className="block text-xs text-grey-500">{s.contactNumber}</span>}
        </div>
      ),
    },
    {
      header: "Schedule",
      cell: (s) => (
        <div className="flex flex-col gap-1">
          <WorkingDaysSelector value={s.workingDays ?? []} readOnly size="sm" />
          {(s.startDate || s.endDate) && (
            <span className="text-xs text-grey-500">
              {s.startDate ?? "—"} → {s.endDate ?? "open"}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Map",
      cell: (s) =>
        s.googleMapsLink ? (
          <a
            href={s.googleMapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View <ExternalLink size={12} aria-hidden="true" />
          </a>
        ) : (
          "—"
        ),
    },
    {
      header: "",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (s) => (
        <div className="flex justify-end">
          <RowMenu
            label={`Actions for ${s.name}`}
            items={[
              {
                label: "Assign Supervisors",
                icon: UserCog,
                onClick: () => setSupervisorsSite(s),
              },
              {
                label: "Assign Cleaners",
                icon: Users,
                onClick: () => setCleanersSite(s),
              },
              {
                label: "Edit",
                icon: Pencil,
                onClick: () => {
                  setEditing(s);
                  setFormOpen(true);
                },
              },
              {
                label: "Delete",
                icon: Trash2,
                destructive: true,
                onClick: () => setDeleting(s),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function confirmDelete() {
    if (!deleting) return;
    deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
  }

  function handleSaveSupervisors(userIds: string[]) {
    if (!supervisorsSite) return;
    assignSupervisors.mutate(
      { siteId: supervisorsSite.id, userIds },
      { onSuccess: () => setSupervisorsSite(null) },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search sites…" className="sm:max-w-xs" />
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
        >
          <Plus size={18} aria-hidden="true" />
          Add site
        </button>
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(s) => s.id}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage="Failed to load sites."
        emptyTitle="No sites yet"
        emptyDescription="Add your first site and link it to a client-company and client."
      />

      <SiteFormModal open={formOpen} onClose={() => setFormOpen(false)} site={editing} />

      <ConfirmDialog
        open={!!deleting}
        title="Delete site"
        description={`Are you sure you want to delete "${deleting?.name}"? This action cannot be undone.`}
        isPending={deleteMutation.isPending}
        error={deleteMutation.isError ? getErrorMessage(deleteMutation.error) : undefined}
        onConfirm={confirmDelete}
        onClose={() => {
          setDeleting(null);
          deleteMutation.reset();
        }}
      />

      <AssignPeopleModal
        open={!!supervisorsSite}
        onClose={() => {
          setSupervisorsSite(null);
          assignSupervisors.reset();
        }}
        title="Assign Supervisors"
        description={supervisorsSite ? `Supervisors for “${supervisorsSite.name}”` : undefined}
        options={supervisorOptions}
        initialSelectedIds={(siteSupervisors.data ?? []).map((u) => u.id)}
        isLoading={siteSupervisors.isLoading || usersQuery.isLoading}
        isSaving={assignSupervisors.isPending}
        error={assignSupervisors.isError ? getErrorMessage(assignSupervisors.error) : undefined}
        emptyMessage="No supervisors exist yet. Invite supervisors from User Management first."
        onSave={handleSaveSupervisors}
      />

      <CleanerProfilesModal
        open={!!cleanersSite}
        onClose={() => setCleanersSite(null)}
        site={cleanersSite}
      />
    </div>
  );
}
