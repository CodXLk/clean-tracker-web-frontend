"use client";

import { useState } from "react";
import { Package, RotateCcw } from "lucide-react";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { PageHeader } from "@/components/shared/PageHeader";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { PillButton } from "@/components/shared/PillButton";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { RequestItemsModal } from "@/components/modals/RequestItemsModal";
import { RequestedItemsModal } from "@/components/modals/RequestedItemsModal";
import type { Priority } from "@/components/shared/PriorityBadge";
import { cn } from "@/lib/utils/cn";

type InventoryFilter = "All" | "Chemicals" | "Tools" | "Consumables";

const FILTER_OPTIONS: InventoryFilter[] = ["All", "Chemicals", "Tools", "Consumables"];

interface SupplyRequest {
  id:       string;
  floor:    string;
  ticket:   string;
  priority: Priority;
  status:   "pending" | "fulfilled";
  date:     string;
  items:    Array<{ name: string; quantity: number }>;
}

const SUPPLY_REQUESTS: SupplyRequest[] = [
  {
    id:       "1",
    floor:    "Floor 2",
    ticket:   "#R-2958",
    priority: "high",
    status:   "pending",
    date:     "2026-04-12",
    items:    [{ name: "Floor Cleaner", quantity: 2 }, { name: "Disinfectant Spray", quantity: 1 }],
  },
  {
    id:       "2",
    floor:    "Floor 1",
    ticket:   "#R-2957",
    priority: "medium",
    status:   "pending",
    date:     "2026-04-10",
    items:    [{ name: "Hand Sanitizer", quantity: 3 }],
  },
  {
    id:       "3",
    floor:    "Floor 1",
    ticket:   "#R-2956",
    priority: "medium",
    status:   "pending",
    date:     "2026-04-10",
    items:    [{ name: "Trash Bags", quantity: 5 }],
  },
];

export default function InventoryPage() {
  const [activeFilter,      setActiveFilter]      = useState<InventoryFilter>("All");
  const [requestModalOpen,  setRequestModalOpen]  = useState(false);
  const [selectedRequest,   setSelectedRequest]   = useState<SupplyRequest | null>(null);

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
          {/* Filter tabs */}
          <FilterTabs
            options={FILTER_OPTIONS}
            value={activeFilter}
            onChange={setActiveFilter}
          />

          {/* Request Items button */}
          <PillButton
            variant="orange"
            onClick={() => setRequestModalOpen(true)}
          >
            <Package size={18} className="mr-2" />
            Request Items
          </PillButton>

          {/* Recent Requests */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-on-surface">Recent Requests</h2>
            <div className="flex flex-col gap-3">
              {SUPPLY_REQUESTS.map((req) => (
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
                      <PriorityBadge priority={req.priority} />
                    </div>
                    <span className="text-xs text-grey-500">{req.floor}</span>
                    <span className="text-xs text-grey-500">{req.ticket}</span>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="rounded-xl bg-[#ED5F25]/20 px-2.5 py-0.5 text-xs font-medium text-[#ED5F25]">
                        Pending
                      </span>
                      <span className="text-xs text-grey-500">{req.date}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Request Items Modal */}
      <RequestItemsModal
        open={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
      />

      {/* Requested Items Modal */}
      {selectedRequest && (
        <RequestedItemsModal
          open={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          items={selectedRequest.items}
        />
      )}

      <BottomNavBar />
    </div>
  );
}
