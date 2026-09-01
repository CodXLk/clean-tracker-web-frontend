"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Plus, Pencil, Trash2, UserCog, Users, Clock, CalendarClock } from "lucide-react";
import { SearchInput } from "@/components/shared/SearchInput";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { DataTable, type Column } from "./DataTable";
import { RowMenu } from "./RowMenu";
import { ConfirmDialog } from "./ConfirmDialog";
import { SiteFormModal } from "./SiteFormModal";
import { WorkingDaysSelector } from "./WorkingDaysSelector";
import { CleanerProfilesModal } from "./CleanerProfilesModal";
import { SupervisorProfilesModal } from "./SupervisorProfilesModal";
import { ShiftsModal } from "./ShiftsModal";
import { SupervisorScheduleModal } from "./SupervisorScheduleModal";
import { useSites, useDeleteSite } from "@/features/user-management/hooks/useSites";
import { useSupervisorSiteFilter } from "@/features/user-management/hooks/useSupervisorSites";
import { useMe } from "@/features/auth/hooks/useMe";
import type { Site } from "@/features/user-management/schemas/site.schema";

export function SiteManagement() {
  const query = useSites();
  const deleteMutation = useDeleteSite();

  const me = useMe();
  const isSupervisor = me.data?.role === "SUPERVISOR";

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Site | null>(null);
  const [deleting, setDeleting] = useState<Site | null>(null);
  const [supervisorsSite, setSupervisorsSite] = useState<Site | null>(null);
  const [cleanersSite, setCleanersSite] = useState<Site | null>(null);
  const [shiftsSite, setShiftsSite] = useState<Site | null>(null);
  const [scheduleSite, setScheduleSite] = useState<Site | null>(null);

  // A supervisor only ever sees sites they're assigned to — there's no bulk "my
  // sites" endpoint, so this filters the full list against each site's roster.
  const supervisorSites = useSupervisorSiteFilter(
    isSupervisor ? query.data ?? [] : [],
    isSupervisor ? me.data?.id : undefined,
  );

  const rows = useMemo(() => {
    const list = isSupervisor ? supervisorSites.sites : query.data ?? [];
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
  }, [query.data, search, isSupervisor, supervisorSites.sites]);

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
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-ink">
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
            className="inline-flex items-center gap-1 text-xs font-medium text-ink hover:underline"
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
            items={
              isSupervisor
                ? [
                    {
                      label: "Assign Cleaners",
                      icon: Users,
                      onClick: () => setCleanersSite(s),
                    },
                  ]
                : [
                    {
                      label: "Supervisor slots",
                      icon: UserCog,
                      onClick: () => setSupervisorsSite(s),
                    },
                    {
                      label: "Assign Cleaners",
                      icon: Users,
                      onClick: () => setCleanersSite(s),
                    },
                    {
                      label: "Shifts",
                      icon: Clock,
                      onClick: () => setShiftsSite(s),
                    },
                    {
                      label: "Inspection schedule",
                      icon: CalendarClock,
                      onClick: () => setScheduleSite(s),
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
                  ]
            }
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search sites…" className="sm:max-w-xs" />
        {!isSupervisor && (
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
          >
            <Plus size={18} aria-hidden="true" />
            Add site
          </button>
        )}
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(s) => s.id}
        isLoading={query.isLoading || (isSupervisor && supervisorSites.isLoading)}
        isError={query.isError}
        errorMessage="Failed to load sites."
        emptyTitle="No sites yet"
        emptyDescription={
          isSupervisor
            ? "No sites are assigned to you yet."
            : "Add your first site and link it to a client-company and client."
        }
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

      <SupervisorProfilesModal
        open={!!supervisorsSite}
        onClose={() => setSupervisorsSite(null)}
        site={supervisorsSite}
      />

      <CleanerProfilesModal
        open={!!cleanersSite}
        onClose={() => setCleanersSite(null)}
        site={cleanersSite}
        restrictToAssignOnly={isSupervisor}
      />

      <ShiftsModal open={!!shiftsSite} onClose={() => setShiftsSite(null)} site={shiftsSite} />

      <SupervisorScheduleModal
        open={!!scheduleSite}
        onClose={() => setScheduleSite(null)}
        site={scheduleSite}
      />
    </div>
  );
}
