"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Mail, Phone } from "lucide-react";
import { SearchInput } from "@/components/shared/SearchInput";
import { DataTable, type Column } from "@/features/user-management/components/DataTable";
import { RowMenu } from "@/features/user-management/components/RowMenu";
import { ConfirmDialog } from "@/features/user-management/components/ConfirmDialog";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useSuppliers, useDeleteSupplier } from "@/features/inventory/hooks/useSuppliers";
import { SupplierFormModal } from "./SupplierFormModal";
import type { Supplier } from "@/features/inventory/schemas/inventory.schema";

interface SuppliersTabProps {
  canManage: boolean;
}

export function SuppliersTab({ canManage }: SuppliersTabProps) {
  const suppliersQuery = useSuppliers();
  const deleteMutation = useDeleteSupplier();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState<Supplier | null>(null);

  const suppliers = suppliersQuery.data ?? [];
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? suppliers.filter((s) => s.name.toLowerCase().includes(q) || (s.email ?? "").toLowerCase().includes(q))
      : suppliers;
  }, [suppliers, search]);

  const columns: Column<Supplier>[] = [
    {
      header: "Supplier",
      sortAccessor: (s) => s.name.toLowerCase(),
      cell: (s) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-on-surface">{s.name}</span>
          {!s.active && <span className="rounded-full bg-grey-100 px-2 py-0.5 text-xs text-grey-500">Inactive</span>}
        </div>
      ),
    },
    {
      header: "Email",
      sortAccessor: (s) => (s.email ?? "").toLowerCase(),
      cell: (s) =>
        s.email ? (
          <span className="inline-flex items-center gap-1.5 text-on-surface">
            <Mail size={14} className="text-grey-400" aria-hidden="true" /> {s.email}
          </span>
        ) : (
          <span className="text-grey-400">—</span>
        ),
    },
    {
      header: "Phone",
      cell: (s) =>
        s.phone ? (
          <span className="inline-flex items-center gap-1.5 text-on-surface">
            <Phone size={14} className="text-grey-400" aria-hidden="true" /> {s.phone}
          </span>
        ) : (
          <span className="text-grey-400">—</span>
        ),
    },
  ];

  if (canManage) {
    columns.push({
      header: "",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (s) => (
        <div className="flex justify-end">
          <RowMenu
            label={`Actions for ${s.name}`}
            items={[
              { label: "Edit", icon: Pencil, onClick: () => { setEditing(s); setFormOpen(true); } },
              { label: "Deactivate", icon: Trash2, destructive: true, onClick: () => setDeleting(s) },
            ]}
          />
        </div>
      ),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search suppliers…" className="sm:max-w-xs" />
        {canManage && (
          <button
            type="button"
            onClick={() => { setEditing(null); setFormOpen(true); }}
            className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Plus size={18} aria-hidden="true" />
            Add supplier
          </button>
        )}
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(s) => s.id}
        isLoading={suppliersQuery.isLoading}
        isError={suppliersQuery.isError}
        errorMessage="Failed to load suppliers."
        emptyTitle="No suppliers yet"
        emptyDescription={canManage ? "Register your first supplier to raise purchase orders." : "No suppliers registered."}
      />

      <SupplierFormModal open={formOpen} onClose={() => setFormOpen(false)} supplier={editing} />
      <ConfirmDialog
        open={!!deleting}
        title="Deactivate supplier"
        description={`Deactivate "${deleting?.name}"? They will no longer appear when creating items or purchase orders.`}
        isPending={deleteMutation.isPending}
        error={deleteMutation.isError ? getErrorMessage(deleteMutation.error) : undefined}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
        onClose={() => { setDeleting(null); deleteMutation.reset(); }}
      />
    </div>
  );
}
