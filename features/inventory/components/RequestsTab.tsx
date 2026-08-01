"use client";

import { useState } from "react";
import { Plus, Check, X, Truck, Ban } from "lucide-react";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { useRequests, useRequestAction } from "@/features/inventory/hooks/useInventory";
import { RequestFormModal } from "./RequestFormModal";
import { DispatchModal } from "./DispatchModal";
import { StatusBadge } from "./StatusBadge";
import { fmtQty, fmtDateTime } from "@/features/inventory/lib/inventory";
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
  const [dispatching, setDispatching] = useState<InventoryRequest | null>(null);

  const query = useRequests(filter === "All" ? {} : { status: STATUS_MAP[filter] });
  const action = useRequestAction();
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
        <div className="flex flex-col gap-3">
          {requests.map((req) => (
            <div key={req.id} className="rounded-2xl border border-grey-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-on-surface">{req.siteName}</span>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-grey-500">
                    By {req.requestedByName ?? "Unknown"} · {fmtDateTime(req.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {canManage && req.status === "PENDING" && (
                    <>
                      <button type="button" onClick={() => action.mutate({ id: req.id, action: "approve" })}
                        className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-variant">
                        <Check size={13} aria-hidden="true" /> Approve
                      </button>
                      <button type="button" onClick={() => action.mutate({ id: req.id, action: "reject" })}
                        className="flex items-center gap-1 rounded-lg border border-grey-300 px-3 py-1.5 text-xs font-medium text-on-surface hover:bg-red-50 hover:text-danger">
                        <X size={13} aria-hidden="true" /> Reject
                      </button>
                    </>
                  )}
                  {canManage && req.status === "APPROVED" && (
                    <button type="button" onClick={() => setDispatching(req)}
                      className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-variant">
                      <Truck size={13} aria-hidden="true" /> Dispatch
                    </button>
                  )}
                  {(req.status === "PENDING" || req.status === "APPROVED") && (
                    <button type="button" onClick={() => action.mutate({ id: req.id, action: "cancel" })}
                      className="flex items-center gap-1 rounded-lg border border-grey-300 px-3 py-1.5 text-xs font-medium text-grey-500 hover:bg-grey-100">
                      <Ban size={13} aria-hidden="true" /> Cancel
                    </button>
                  )}
                </div>
              </div>

              <ul className="mt-3 flex flex-wrap gap-2">
                {req.lines.map((l) => (
                  <li key={l.itemId} className="rounded-lg bg-grey-100 px-2.5 py-1 text-xs text-on-surface">
                    {l.itemName} · <span className="font-medium">{fmtQty(l.requestedQuantity)} {l.unit}</span>
                  </li>
                ))}
              </ul>
              {req.note && <p className="mt-2 text-xs text-grey-500">“{req.note}”</p>}
              {req.reviewedByName && (
                <p className="mt-1 text-xs text-grey-400">
                  Reviewed by {req.reviewedByName} · {fmtDateTime(req.reviewedAt)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <RequestFormModal open={formOpen} onClose={() => setFormOpen(false)} />
      <DispatchModal open={!!dispatching} onClose={() => setDispatching(null)} request={dispatching} />
    </div>
  );
}
