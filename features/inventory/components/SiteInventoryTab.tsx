"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, SlidersHorizontal } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { PillButton } from "@/components/shared/PillButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { cn } from "@/lib/utils/cn";
import { SearchableSelect, type SelectOption } from "@/features/user-management/components/SearchableSelect";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useSites } from "@/features/user-management/hooks/useSites";
import { useSiteInventory, useAdjustSiteStock } from "@/features/inventory/hooks/useInventory";
import { CATEGORY_LABELS, type SiteInventory } from "@/features/inventory/schemas/inventory.schema";
import { fmtQty } from "@/features/inventory/lib/inventory";

interface SiteInventoryTabProps {
  canManage: boolean;
}

export function SiteInventoryTab({ canManage }: SiteInventoryTabProps) {
  const sitesQuery = useSites();
  const [siteId, setSiteId] = useState<string>("");
  const inventoryQuery = useSiteInventory(siteId || undefined);
  const [adjusting, setAdjusting] = useState<SiteInventory | null>(null);

  const siteOptions: SelectOption[] = useMemo(
    () => (sitesQuery.data ?? []).map((s) => ({ value: s.id, label: s.name })),
    [sitesQuery.data],
  );
  const rows = inventoryQuery.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="max-w-sm">
        <SearchableSelect
          label="Site"
          options={siteOptions}
          value={siteId || null}
          onChange={setSiteId}
          loading={sitesQuery.isLoading}
          placeholder="Select a site to view its inventory"
        />
      </div>

      {!siteId ? (
        <EmptyState title="Select a site" description="Choose a site to see its stock and minimum levels." />
      ) : inventoryQuery.isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size={28} /></div>
      ) : rows.length === 0 ? (
        <EmptyState title="No stock yet" description="This site has no inventory. Dispatch a delivery to stock it." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-grey-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-grey-200 text-left text-xs font-semibold uppercase tracking-wide text-grey-500">
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">On hand</th>
                <th className="px-4 py-3">Min stock</th>
                <th className="px-4 py-3">Status</th>
                {canManage && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={cn("border-b border-grey-100 last:border-b-0", r.lowStock && "bg-[#ED5F25]/[0.04]")}>
                  <td className="px-4 py-3 font-medium text-on-surface">{r.itemName}</td>
                  <td className="px-4 py-3 text-grey-500">{CATEGORY_LABELS[r.category]}</td>
                  <td className="px-4 py-3">{fmtQty(r.quantity)} <span className="text-xs text-grey-500">{r.unit}</span></td>
                  <td className="px-4 py-3 text-grey-500">{r.minStock != null ? `${fmtQty(r.minStock)} ${r.unit}` : "—"}</td>
                  <td className="px-4 py-3">
                    {r.lowStock ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#ED5F25]/10 px-2.5 py-0.5 text-xs font-medium text-[#ED5F25]">
                        <AlertTriangle size={12} aria-hidden="true" /> Low
                      </span>
                    ) : (
                      <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">OK</span>
                    )}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => setAdjusting(r)}
                        aria-label={`Adjust ${r.itemName}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-grey-500 hover:bg-grey-100 hover:text-primary">
                        <SlidersHorizontal size={15} aria-hidden="true" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SiteAdjustModal siteId={siteId} row={adjusting} onClose={() => setAdjusting(null)} />
    </div>
  );
}

function SiteAdjustModal({ siteId, row, onClose }: { siteId: string; row: SiteInventory | null; onClose: () => void }) {
  const mutation = useAdjustSiteStock();
  const [quantity, setQuantity] = useState("");
  const [minStock, setMinStock] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (row) {
      setQuantity(String(row.quantity));
      setMinStock(row.minStock != null ? String(row.minStock) : "");
      setNote("");
      mutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row]);

  if (!row) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate({
      siteId,
      input: {
        itemId: row!.itemId,
        quantity: parseFloat(quantity) || 0,
        minStock: minStock === "" ? undefined : parseFloat(minStock),
        note: note.trim() || undefined,
      },
    }, { onSuccess: onClose });
  }

  return (
    <Modal open={!!row} onClose={onClose} title={`Adjust — ${row.itemName}`} description={`At ${row.siteName}`}>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <TextField label={`On hand (${row.unit})`} type="number" step="0.001" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <TextField label={`Min stock (${row.unit})`} type="number" step="0.001" min="0" placeholder="—" value={minStock} onChange={(e) => setMinStock(e.target.value)} />
        </div>
        <TextField label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        {mutation.isError && (
          <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">{getErrorMessage(mutation.error)}</p>
        )}
        <div className="mt-1 flex gap-3">
          <button type="button" onClick={onClose} className="h-11 flex-1 rounded-full border border-grey-300 text-sm font-semibold text-on-surface hover:bg-grey-100">Cancel</button>
          <PillButton type="submit" variant="teal" className="h-11 flex-1" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save"}
          </PillButton>
        </div>
      </form>
    </Modal>
  );
}
