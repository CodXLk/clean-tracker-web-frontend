"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { useMe } from "@/features/auth/hooks/useMe";
import { useLowStock } from "@/features/inventory/hooks/useInventory";
import { isManagementUser, fmtQty } from "@/features/inventory/lib/inventory";
import { WarehouseTab } from "@/features/inventory/components/WarehouseTab";
import { RequestsTab } from "@/features/inventory/components/RequestsTab";
import { DeliveriesTab } from "@/features/inventory/components/DeliveriesTab";
import { SiteInventoryTab } from "@/features/inventory/components/SiteInventoryTab";
import { LogsTab } from "@/features/inventory/components/LogsTab";

const TABS = ["Warehouse", "Requests", "Deliveries", "Site Inventory", "Logs"] as const;
type Tab = (typeof TABS)[number];

export default function InventoryPage() {
  const { data: me } = useMe();
  const canManage = isManagementUser(me);
  const lowStockQuery = useLowStock();
  const lowStock = lowStockQuery.data ?? [];

  const [tab, setTab] = useState<Tab>("Warehouse");

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-sm text-grey-500">Warehouse stock, site deliveries and consumption.</p>
        </div>

        {lowStock.length > 0 && (
          <div className="mb-6 rounded-2xl border border-[#ED5F25]/30 bg-[#ED5F25]/[0.06] p-4">
            <div className="flex items-center gap-2 text-[#ED5F25]">
              <AlertTriangle size={18} aria-hidden="true" />
              <span className="text-sm font-semibold">
                {lowStock.length} item{lowStock.length === 1 ? "" : "s"} below minimum stock
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {lowStock.slice(0, 8).map((s) => (
                <span key={s.id} className="rounded-lg bg-white px-2.5 py-1 text-xs text-on-surface">
                  {s.itemName} @ {s.siteName} · <span className="font-medium text-[#ED5F25]">{fmtQty(s.quantity)} {s.unit}</span>
                </span>
              ))}
              {lowStock.length > 8 && (
                <button type="button" onClick={() => setTab("Site Inventory")} className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-primary">
                  +{lowStock.length - 8} more
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mb-6 overflow-x-auto">
          <FilterTabs<Tab> options={[...TABS]} value={tab} onChange={setTab} />
        </div>

        {tab === "Warehouse" && <WarehouseTab canManage={canManage} />}
        {tab === "Requests" && <RequestsTab canManage={canManage} />}
        {tab === "Deliveries" && <DeliveriesTab canManage={canManage} />}
        {tab === "Site Inventory" && <SiteInventoryTab canManage={canManage} />}
        {tab === "Logs" && <LogsTab />}
      </div>
    </div>
  );
}
