"use client";

import { useState } from "react";
import { Package, RotateCcw } from "lucide-react";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { PageHeader } from "@/components/shared/PageHeader";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { PillButton } from "@/components/shared/PillButton";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { RequestItemsModal } from "@/components/modals/RequestItemsModal";
import { RequestedItemsModal } from "@/components/modals/RequestedItemsModal";
import { StatusBadge } from "@/features/inventory/components/StatusBadge";
import { useRequests } from "@/features/inventory/hooks/useInventory";
import { fmtDateTime } from "@/features/inventory/lib/inventory";
import type { InventoryRequest, RequestStatus } from "@/features/inventory/schemas/inventory.schema";

const STATUS_TABS = ["All", "Pending", "Approved", "Fulfilled"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

const TAB_TO_STATUS: Record<StatusTab, RequestStatus | undefined> = {
  All: undefined,
  Pending: "PENDING",
  Approved: "APPROVED",
  Fulfilled: "FULFILLED",
};

export default function InventoryPage() {
  const [activeFilter, setActiveFilter] = useState<StatusTab>("All");
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<InventoryRequest | null>(null);

  const { data: requests = [], isLoading } = useRequests({ status: TAB_TO_STATUS[activeFilter] });

  // Hide the mobile bottom nav while a bottom-sheet modal is open so it can't render on
  // top of it; the desktop sidebar is unaffected since it never overlaps these panels.
  const modalOpen = requestModalOpen || !!selectedRequest;

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at top left, rgba(71,114,115,0.18) 0%, transparent 60%), #F5F5F5",
      }}
    >
      <PageHeader title="Inventory" />

      <main className="mx-auto max-w-2xl px-5 pb-28 lg:max-w-5xl -mt-5">
        <div className="flex flex-col gap-4 pt-5">
          {/* Status filter tabs */}
          <FilterTabs
            options={[...STATUS_TABS]}
            value={activeFilter}
            onChange={setActiveFilter}
          />

          {/* Request Items button */}
          <PillButton variant="orange" onClick={() => setRequestModalOpen(true)}>
            <Package size={18} className="mr-2" />
            Request Items
          </PillButton>

          {/* Recent Requests */}
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
                    {/* Icon circle */}
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary">
                      <RotateCcw size={16} className="text-primary" />
                    </div>

                    {/* Content */}
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

      {/* Request Items Modal */}
      <RequestItemsModal open={requestModalOpen} onClose={() => setRequestModalOpen(false)} />

      {/* Requested Items Modal */}
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

      <BottomNavBar hideMobileBar={modalOpen} />
    </div>
  );
}
