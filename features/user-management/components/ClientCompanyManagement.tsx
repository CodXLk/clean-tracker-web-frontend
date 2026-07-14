"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { SearchInput } from "@/components/shared/SearchInput";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { DataTable, type Column } from "./DataTable";
import { RowActions } from "./RowActions";
import { ConfirmDialog } from "./ConfirmDialog";
import { ClientCompanyFormModal } from "./ClientCompanyFormModal";
import { useClientCompanies, useDeleteClientCompany } from "@/features/user-management/hooks/useClientCompanies";
import type { ClientCompany } from "@/features/user-management/schemas/clientCompany.schema";

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

export function ClientCompanyManagement() {
  const query = useClientCompanies();
  const deleteMutation = useDeleteClientCompany();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ClientCompany | null>(null);
  const [deleting, setDeleting] = useState<ClientCompany | null>(null);

  const rows = useMemo(() => {
    const list = query.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.contactNumber ?? "").toLowerCase().includes(q),
    );
  }, [query.data, search]);

  const columns: Column<ClientCompany>[] = [
    {
      header: "Name",
      sortAccessor: (c) => c.name.toLowerCase(),
      cell: (c) => <span className="font-medium text-on-surface">{c.name}</span>,
    },
    {
      header: "Contact number",
      sortAccessor: (c) => c.contactNumber ?? "",
      cell: (c) => c.contactNumber ?? "—",
    },
    {
      header: "Email",
      sortAccessor: (c) => c.email ?? "",
      cell: (c) => c.email ?? "—",
    },
    {
      header: "Created",
      sortAccessor: (c) => c.createdAt ?? "",
      cell: (c) => <span className="text-grey-500">{formatDate(c.createdAt)}</span>,
    },
    {
      header: "",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (c) => (
        <RowActions
          onEdit={() => {
            setEditing(c);
            setFormOpen(true);
          }}
          onDelete={() => setDeleting(c)}
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
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search client-companies…"
          className="sm:max-w-xs"
        />
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
        >
          <Plus size={18} aria-hidden="true" />
          Add client-company
        </button>
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(c) => c.id}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage="Failed to load client-companies."
        emptyTitle="No client-companies yet"
        emptyDescription="Add your first client-company to get started."
      />

      <ClientCompanyFormModal open={formOpen} onClose={() => setFormOpen(false)} company={editing} />

      <ConfirmDialog
        open={!!deleting}
        title="Delete client-company"
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
