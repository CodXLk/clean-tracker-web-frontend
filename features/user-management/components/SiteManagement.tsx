"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Plus } from "lucide-react";
import { SearchInput } from "@/components/shared/SearchInput";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { DataTable, type Column } from "./DataTable";
import { RowActions } from "./RowActions";
import { ConfirmDialog } from "./ConfirmDialog";
import { SiteFormModal } from "./SiteFormModal";
import { useSites, useDeleteSite } from "@/features/user-management/hooks/useSites";
import type { Site } from "@/features/user-management/schemas/site.schema";

export function SiteManagement() {
  const query = useSites();
  const deleteMutation = useDeleteSite();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Site | null>(null);
  const [deleting, setDeleting] = useState<Site | null>(null);

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
        <RowActions
          onEdit={() => {
            setEditing(s);
            setFormOpen(true);
          }}
          onDelete={() => setDeleting(s)}
        />
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
    </div>
  );
}
