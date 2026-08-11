"use client";

import { useState } from "react";
import { AlertTriangle, CalendarClock, Package, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { PillButton } from "@/components/shared/PillButton";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { RequestItemsModal } from "@/components/modals/RequestItemsModal";
import { RequestedItemsModal } from "@/components/modals/RequestedItemsModal";
import { StatusBadge } from "@/features/inventory/components/StatusBadge";
import { useMe } from "@/features/auth/hooks/useMe";
import {
  useRequests,
  useLowStock,
  useInventoryStats,
} from "@/features/inventory/hooks/useInventory";
import { isManagementUser, fmtQty, fmtDateTime } from "@/features/inventory/lib/inventory";
import { WarehouseTab } from "@/features/inventory/components/WarehouseTab";
import { RequestsTab } from "@/features/inventory/components/RequestsTab";
import { DeliveriesTab } from "@/features/inventory/components/DeliveriesTab";
import { SiteInventoryTab } from "@/features/inventory/components/SiteInventoryTab";
import { CleanerInventoryTab } from "@/features/inventory/components/CleanerInventoryTab";
import { SuppliersTab } from "@/features/inventory/components/SuppliersTab";
import { PurchaseOrdersTab } from "@/features/inventory/components/PurchaseOrdersTab";
import { LogsTab } from "@/features/inventory/components/LogsTab";
import type { InventoryRequest, RequestStatus } from "@/features/inventory/schemas/inventory.schema";

const ADMIN_TABS = [
  "Warehouse",
  "Suppliers",
  "Purchase Orders",
  "Requests",
  "Deliveries",
  "Site Inventory",
  "Cleaner Inventory",
  "Logs",
] as const;
type AdminTab = (typeof ADMIN_TABS)[number];

const MOBILE_STATUS_TABS = ["All", "Pending", "Approved", "Fulfilled"] as const;
type MobileStatusTab = (typeof MOBILE_STATUS_TABS)[number];

const TAB_TO_STATUS: Record<MobileStatusTab, RequestStatus | undefined> = {
  All: undefined,
  Pending: "PENDING",
  Approved: "APPROVED",
  Fulfilled: "FULFILLED",
};

export default function InventoryPage() {
  return (
    <>
      <DesktopInventoryConsole />
      <MobileInventory />
    </>
  );
}

/* ---------- Desktop (admin-style back-office console) ---------- */

function DesktopInventoryConsole() {
  const { data: me } = useMe();
  const canManage = isManagementUser(me);
  const lowStockQuery = useLowStock();
  const lowStock = lowStockQuery.data ?? [];
  const statsQuery = useInventoryStats();
  const stats = statsQuery.data;

  const [tab, setTab] = useState<AdminTab>("Warehouse");

  return (
    <div className="hidden p-6 lg:block lg:p-8">
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
                  {s.itemName} @ {s.siteName} ·{" "}
                  <span className="font-medium text-[#ED5F25]">
                    {fmtQty(s.quantity)} {s.unit}
                  </span>
                </span>
              ))}
              {lowStock.length > 8 && (
                <button
                  type="button"
                  onClick={() => setTab("Site Inventory")}
                  className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-primary"
                >
                  +{lowStock.length - 8} more
                </button>
              )}
            </div>
          </div>
        )}

        {stats && (stats.expiredBatchCount > 0 || stats.nearExpiryBatchCount > 0) && (
          <div className="mb-6 rounded-2xl border border-error/30 bg-error/[0.05] p-4">
            <div className="flex items-center gap-2 text-error">
              <CalendarClock size={18} aria-hidden="true" />
              <span className="text-sm font-semibold">Expiry alerts</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {stats.expiredBatchCount > 0 && (
                <span className="rounded-lg bg-white px-2.5 py-1 text-on-surface">
                  Expired:{" "}
                  <span className="font-medium text-error">
                    {fmtQty(stats.expiredQuantity)} units · {stats.expiredBatchCount} batch
                    {stats.expiredBatchCount === 1 ? "" : "es"}
                  </span>
                </span>
              )}
              {stats.nearExpiryBatchCount > 0 && (
                <span className="rounded-lg bg-white px-2.5 py-1 text-on-surface">
                  Expiring within {stats.nearExpiryDays} days:{" "}
                  <span className="font-medium text-[#ED5F25]">
                    {fmtQty(stats.nearExpiryQuantity)} units · {stats.nearExpiryBatchCount} batch
                    {stats.nearExpiryBatchCount === 1 ? "" : "es"}
                  </span>
                </span>
              )}
            </div>
          </div>
        )}

        <div className="mb-6 overflow-x-auto">
          <FilterTabs<AdminTab> options={[...ADMIN_TABS]} value={tab} onChange={setTab} />
        </div>

        {tab === "Warehouse" && <WarehouseTab canManage={canManage} />}
        {tab === "Suppliers" && <SuppliersTab canManage={canManage} />}
        {tab === "Purchase Orders" && <PurchaseOrdersTab canManage={canManage} />}
        {tab === "Requests" && <RequestsTab canManage={canManage} />}
        {tab === "Deliveries" && <DeliveriesTab canManage={canManage} />}
        {tab === "Site Inventory" && <SiteInventoryTab canManage={canManage} />}
        {tab === "Cleaner Inventory" && <CleanerInventoryTab canManage={canManage} />}
        {tab === "Logs" && <LogsTab />}
      </div>
    </div>
  );
}

/* ---------- Mobile (cleaner-style request flow) ---------- */

function MobileInventory() {
  const [activeFilter, setActiveFilter] = useState<MobileStatusTab>("All");
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<InventoryRequest | null>(null);

  const { data: requests = [], isLoading } = useRequests({ status: TAB_TO_STATUS[activeFilter] });

  return (
    <div
      className="min-h-screen lg:hidden"
      style={{
        background:
          "radial-gradient(ellipse at top left, rgba(71,114,115,0.18) 0%, transparent 60%), #F5F5F5",
      }}
    >
      <PageHeader title="Inventory" />

      <main className="mx-auto max-w-2xl px-5 pb-10">
        <div className="flex flex-col gap-4">
          <FilterTabs options={[...MOBILE_STATUS_TABS]} value={activeFilter} onChange={setActiveFilter} />

          <PillButton variant="orange" onClick={() => setRequestModalOpen(true)}>
            <Package size={18} className="mr-2" />
            Request Items
          </PillButton>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-on-surface">Recent Requests</h2>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : requests.length === 0 ? (
              <p className="py-12 text-center text-sm text-grey-500">
                No requests yet. Tap “Request Items” to raise one.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {requests.map((req) => (
                  <button
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className="flex w-full items-start gap-3 rounded-2xl bg-white p-4 shadow-sm text-left transition-shadow hover:shadow-md"
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary">
                      <RotateCcw size={16} className="text-primary" />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-on-surface leading-snug">
                          Supply Request
                        </span>
                        <StatusBadge status={req.status} />
                      </div>
                      <span className="text-xs text-grey-500">{req.siteName}</span>
                      <span className="text-xs text-grey-500">#{req.id.slice(0, 8)}</span>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="rounded-xl bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {req.lines.length} item{req.lines.length === 1 ? "" : "s"}
                        </span>
                        <span className="text-xs text-grey-500">{fmtDateTime(req.createdAt)}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <RequestItemsModal open={requestModalOpen} onClose={() => setRequestModalOpen(false)} />

      {selectedRequest && (
        <RequestedItemsModal
          open={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          items={selectedRequest.lines.map((line) => ({
            name: line.itemName,
            quantity: line.requestedQuantity,
          }))}
        />
      )}
    </div>
  );
}
