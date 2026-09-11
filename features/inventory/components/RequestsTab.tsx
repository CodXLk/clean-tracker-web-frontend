"use client";

import { useState } from "react";
import { Plus, Eye } from "lucide-react";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { useRequests } from "@/features/inventory/hooks/useInventory";
import { RequestFormModal } from "./RequestFormModal";
import { RequestDetailModal } from "./RequestDetailModal";
import { StatusBadge } from "./StatusBadge";
import { fmtDateTime } from "@/features/inventory/lib/inventory";
import type { InventoryRequest, RequestStatus } from "@/features/inventory/schemas/inventory.schema";

const FILTERS = ["All", "Pending", "Approved", "Rejected", "Fulfilled"] as const;
type Filter = (typeof FILTERS)[number];
const STATUS_MAP: Record<Exclude<Filter, "All">, RequestStatus> = {
  Pending: "PENDING", Approved: "APPROVED", Rejected: "REJECTED", Fulfilled: "FULFILLED",
};

interface RequestsTabProps {
  canManage: boolean;
}

export function RequestsTab({ canManage }: RequestsTabProps) {
  const [filter, setFilter] = useState<Filter>("All");
  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState<InventoryRequest | null>(null);

  const query = useRequests(filter === "All" ? {} : { status: STATUS_MAP[filter] });
  const requests = query.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs<Filter> options={[...FILTERS]} value={filter} onChange={setFilter} />
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Plus size={18} aria-hidden="true" />
          New request
        </button>
      </div>

      {query.isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size={28} /></div>
      ) : query.isError ? (
        <ErrorMessage message="Failed to load requests." />
      ) : requests.length === 0 ? (
        <EmptyState title="No requests" description="Item requests raised for sites appear here." />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-grey-300 text-xs uppercase tracking-wide text-grey-500">
                  <th className="px-5 py-3 font-medium">Site</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Requested by</th>
                  <th className="px-5 py-3 font-medium">Items</th>
                  <th className="px-5 py-3 font-medium">Raised</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">View</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-b border-grey-100 last:border-0">
                    <td className="px-5 py-3.5 font-medium text-on-surface">{req.siteName}</td>
                    <td className="px-5 py-3.5 text-grey-700">
                      {req.requestType === "CLEANER"
                        ? `To cleaner${req.targetCleanerName ? `: ${req.targetCleanerName}` : ""}`
                        : "Site restock"}
                    </td>
                    <td className="px-5 py-3.5 text-grey-700">{req.requestedByName ?? "Unknown"}</td>
                    <td className="px-5 py-3.5 text-grey-700">{req.lines.length}</td>
                    <td className="px-5 py-3.5 text-grey-700">{fmtDateTime(req.createdAt)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={req.status} /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          aria-label={`View request for ${req.siteName}`}
                          onClick={() => setViewing(req)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-grey-100 hover:text-ink"
                        >
                          <Eye size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <RequestFormModal open={formOpen} onClose={() => setFormOpen(false)} canManage={canManage} />
      <RequestDetailModal
        open={!!viewing}
        onClose={() => setViewing(null)}
        request={viewing}
        canManage={canManage}
      />
    </div>
  );
}
