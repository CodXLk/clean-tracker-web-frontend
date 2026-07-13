"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { SearchInput } from "@/components/shared/SearchInput";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { DataTable, type Column } from "./DataTable";
import { RowActions } from "./RowActions";
import { ConfirmDialog } from "./ConfirmDialog";
import { ClientFormModal } from "./ClientFormModal";
import { useClients, useDeleteClient } from "@/features/user-management/hooks/useClients";
import type { Client } from "@/features/user-management/schemas/client.schema";

export function ClientManagement() {
  const query = useClients();
  const deleteMutation = useDeleteClient();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState<Client | null>(null);

  const rows = useMemo(() => {
    const list = query.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.clientCompanyName.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.contactNumber ?? "").toLowerCase().includes(q),
    );
  }, [query.data, search]);

  const columns: Column<Client>[] = [
    {
      header: "Name",
      sortAccessor: (c) => c.name.toLowerCase(),
      cell: (c) => <span className="font-medium text-on-surface">{c.name}</span>,
    },
    {
      header: "Client-company",
      sortAccessor: (c) => c.clientCompanyName.toLowerCase(),
      cell: (c) => (
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          {c.clientCompanyName}
        </span>
      ),
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
        <SearchInput value={search} onChange={setSearch} placeholder="Search clients…" className="sm:max-w-xs" />
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
        >
          <Plus size={18} aria-hidden="true" />
          Add client
        </button>
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(c) => c.id}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage="Failed to load clients."
        emptyTitle="No clients yet"
        emptyDescription="Add your first client and assign it to a client-company."
      />

      <ClientFormModal open={formOpen} onClose={() => setFormOpen(false)} client={editing} />

      <ConfirmDialog
        open={!!deleting}
        title="Delete client"
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
