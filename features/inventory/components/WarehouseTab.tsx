"use client";

import { useMemo, useState } from "react";
import { Package, DollarSign, AlertTriangle, Boxes, Plus, Pencil, Trash2, PackagePlus } from "lucide-react";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { SearchInput } from "@/components/shared/SearchInput";
import { DataTable, type Column } from "@/features/user-management/components/DataTable";
import { RowMenu } from "@/features/user-management/components/RowMenu";
import { ConfirmDialog } from "@/features/user-management/components/ConfirmDialog";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useInventoryItems, useLowStock, useDeleteItem } from "@/features/inventory/hooks/useInventory";
import { ItemFormModal } from "./ItemFormModal";
import { AdjustStockModal } from "./AdjustStockModal";
import { CATEGORY_LABELS, type InventoryItem } from "@/features/inventory/schemas/inventory.schema";
import { fmtQty, fmtMoney } from "@/features/inventory/lib/inventory";

interface WarehouseTabProps {
  canManage: boolean;
}

export function WarehouseTab({ canManage }: WarehouseTabProps) {
  const itemsQuery = useInventoryItems();
  const lowStockQuery = useLowStock();
  const deleteMutation = useDeleteItem();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [adjusting, setAdjusting] = useState<InventoryItem | null>(null);
  const [deleting, setDeleting] = useState<InventoryItem | null>(null);

  const items = itemsQuery.data ?? [];
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;
  }, [items, search]);

  const totalValue = items.reduce((sum, i) => sum + i.stockValue, 0);

  const columns: Column<InventoryItem>[] = [
    {
      header: "Item",
      sortAccessor: (i) => i.name.toLowerCase(),
      cell: (i) => (
        <div>
          <span className="font-medium text-on-surface">{i.name}</span>
          {!i.active && <span className="ml-2 rounded-full bg-grey-100 px-2 py-0.5 text-xs text-grey-500">Inactive</span>}
        </div>
      ),
    },
    {
      header: "Category",
      sortAccessor: (i) => i.category,
      cell: (i) => (
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          {CATEGORY_LABELS[i.category]}
        </span>
      ),
    },
    { header: "Unit price", sortAccessor: (i) => i.unitPrice, cell: (i) => fmtMoney(i.unitPrice) },
    {
      header: "Main stock",
      sortAccessor: (i) => i.mainStockQuantity,
      cell: (i) => (
        <span className="font-medium text-on-surface">
          {fmtQty(i.mainStockQuantity)} <span className="text-xs text-grey-500">{i.unit}</span>
        </span>
      ),
    },
    { header: "Value", sortAccessor: (i) => i.stockValue, cell: (i) => fmtMoney(i.stockValue) },
  ];

  if (canManage) {
    columns.push({
      header: "",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (i) => (
        <div className="flex justify-end">
          <RowMenu
            label={`Actions for ${i.name}`}
            items={[
              { label: "Adjust stock", icon: PackagePlus, onClick: () => setAdjusting(i) },
              { label: "Edit", icon: Pencil, onClick: () => { setEditing(i); setFormOpen(true); } },
              { label: "Delete", icon: Trash2, destructive: true, onClick: () => setDeleting(i) },
            ]}
          />
        </div>
      ),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AdminStatCard icon={Boxes} iconBg="bg-primary/10" iconColor="text-primary" value={items.length} label="Items in catalog" />
        <AdminStatCard icon={DollarSign} iconBg="bg-success/10" iconColor="text-success" value={fmtMoney(totalValue)} label="Total stock value" />
        <AdminStatCard icon={AlertTriangle} iconBg="bg-[#ED5F25]/10" iconColor="text-[#ED5F25]" value={lowStockQuery.data?.length ?? 0} label="Low-stock (all sites)" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search items…" className="sm:max-w-xs" />
        {canManage && (
          <button
            type="button"
            onClick={() => { setEditing(null); setFormOpen(true); }}
            className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Plus size={18} aria-hidden="true" />
            Add item
          </button>
        )}
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(i) => i.id}
        isLoading={itemsQuery.isLoading}
        isError={itemsQuery.isError}
        errorMessage="Failed to load inventory items."
        emptyTitle="No items yet"
        emptyDescription={canManage ? "Add your first warehouse item to begin." : "No inventory items."}
      />

      <ItemFormModal open={formOpen} onClose={() => setFormOpen(false)} item={editing} />
      <AdjustStockModal open={!!adjusting} onClose={() => setAdjusting(null)} item={adjusting} />
      <ConfirmDialog
        open={!!deleting}
        title="Delete item"
        description={`Delete "${deleting?.name}"? If it exists in any site inventory, deactivate it instead.`}
        isPending={deleteMutation.isPending}
        error={deleteMutation.isError ? getErrorMessage(deleteMutation.error) : undefined}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
        onClose={() => { setDeleting(null); deleteMutation.reset(); }}
      />
    </div>
  );
}
