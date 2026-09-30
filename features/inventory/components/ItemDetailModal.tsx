"use client";

import { Modal } from "@/components/shared/Modal";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { useItemUnits } from "@/features/inventory/hooks/useInventory";
import {
  CATEGORY_LABELS,
  ITEM_UNIT_STATUS_LABELS,
  type InventoryItem,
} from "@/features/inventory/schemas/inventory.schema";
import { fmtQty, fmtMoney } from "@/features/inventory/lib/inventory";

interface ItemDetailModalProps {
  open: boolean;
  onClose: () => void;
  item: InventoryItem | null;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-grey-500">{label}</span>
      <span className="text-sm font-medium text-on-surface">{value}</span>
    </div>
  );
}

export function ItemDetailModal({ open, onClose, item }: ItemDetailModalProps) {
  const isUnitTracked = item?.category === "TOOL" || item?.category === "EQUIPMENT";
  const unitsQuery = useItemUnits(item?.id, open && isUnitTracked);

  if (!item) return null;

  return (
    <Modal open={open} onClose={onClose} title={item.name}>
      <div className="flex flex-col gap-4">
        {item.hasPhoto && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`/api${ENDPOINTS.inventory.itemPhoto(item.id)}`}
            alt={item.name}
            className="h-40 w-full rounded-xl border border-grey-200 object-contain"
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category" value={CATEGORY_LABELS[item.category]} />
          <Field label="Item code" value={item.itemCode || "—"} />
          <Field label="Unit" value={item.unit} />
          <Field label="Supplier" value={item.supplierName || "—"} />
          <Field label="Unit price" value={fmtMoney(item.unitPrice)} />
          <Field label="Cost price" value={item.costPrice != null ? fmtMoney(item.costPrice) : "—"} />
          <Field label="Main stock" value={`${fmtQty(item.mainStockQuantity)} ${item.unit}`} />
          <Field label="Stock value" value={fmtMoney(item.stockValue)} />
        </div>

        {item.category === "CHEMICAL" && (
          <div className="rounded-xl border border-grey-200 p-3">
            <span className="text-xs text-grey-500">Safety Data Sheet</span>
            {item.hasSds ? (
              <a
                href={`/api${ENDPOINTS.inventory.itemSds(item.id)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block text-sm font-semibold text-teal hover:underline"
              >
                {item.sdsFilename || "View SDS"}
              </a>
            ) : (
              <p className="mt-1 text-sm text-grey-500">No SDS uploaded.</p>
            )}
          </div>
        )}

        {isUnitTracked && (
          <div className="rounded-xl border border-grey-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-on-surface">Tracked units</span>
              <span className="text-xs text-grey-500">{unitsQuery.data?.length ?? 0} unit(s)</span>
            </div>
            {unitsQuery.isLoading ? (
              <p className="text-sm text-grey-500">Loading units…</p>
            ) : (unitsQuery.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-grey-500">No individually-tracked units.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {unitsQuery.data!.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center gap-2 rounded-full border border-grey-200 bg-grey-50 px-3 py-1 text-xs"
                  >
                    <span className="font-mono font-medium text-on-surface">{u.unitCode}</span>
                    <span className="text-grey-500">{ITEM_UNIT_STATUS_LABELS[u.status]}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-1 h-11 rounded-full border border-grey-300 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
