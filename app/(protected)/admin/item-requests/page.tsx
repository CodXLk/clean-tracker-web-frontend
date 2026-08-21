"use client";

import { useMemo, useState } from "react";
import { PackageCheck, ClipboardList } from "lucide-react";
import { useIsDrawerNav } from "@/components/layout/AppNav";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { cn } from "@/lib/utils/cn";
import { useClientItemRequests } from "@/features/inventory/hooks/usePurchaseOrders";
import { ClientDispatchModal } from "@/features/inventory/components/ClientDispatchModal";
import { PO_STATUS_LABELS, type PurchaseOrder } from "@/features/inventory/schemas/inventory.schema";

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export default function ItemRequestsPage() {
  const useDrawerNav = useIsDrawerNav();
  const requestsQuery = useClientItemRequests();
  const [active, setActive] = useState<PurchaseOrder | null>(null);

  const requests = requestsQuery.data ?? [];
  const pending = useMemo(() => requests.filter((r) => r.status === "AWAITING_CLIENT"), [requests]);
  const history = useMemo(() => requests.filter((r) => r.status !== "AWAITING_CLIENT"), [requests]);

  return (
    <>
      {!useDrawerNav && (
        <div className="lg:hidden">
          <PageHeader title="Item Requests" />
        </div>
      )}

      <div className={cn("px-6 pt-6 lg:px-8 lg:pt-8", !useDrawerNav ? "pb-28 lg:pb-8" : "pb-6 lg:pb-8")}>
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-on-surface">Item Requests</h1>
            <p className="text-sm text-grey-500">
              Requests for items to supply to your site. Review, adjust quantities and dispatch — the site
              team then confirms what they receive.
            </p>
          </div>

          {requestsQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-grey-300 bg-grey-50 px-6 py-16 text-center">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ClipboardList size={24} aria-hidden="true" />
              </span>
              <h3 className="text-sm font-semibold text-on-surface">No item requests yet</h3>
              <p className="mt-1 max-w-sm text-sm text-grey-500">
                When items are requested from you, they will appear here to review and dispatch.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {pending.length > 0 && (
                <section>
                  <h2 className="mb-3 text-sm font-semibold text-on-surface">Awaiting your action</h2>
                  <div className="flex flex-col gap-3">
                    {pending.map((req) => (
                      <RequestCard key={req.id} req={req} onAction={() => setActive(req)} actionable />
                    ))}
                  </div>
                </section>
              )}

              {history.length > 0 && (
                <section>
                  <h2 className="mb-3 text-sm font-semibold text-on-surface">History</h2>
                  <div className="flex flex-col gap-3">
                    {history.map((req) => (
                      <RequestCard key={req.id} req={req} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      <ClientDispatchModal open={!!active} onClose={() => setActive(null)} request={active} />
    </>
  );
}

function RequestCard({
  req,
  onAction,
  actionable = false,
}: {
  req: PurchaseOrder;
  onAction?: () => void;
  actionable?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-grey-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-on-surface">{req.siteName ?? "—"}</p>
          <p className="text-xs text-grey-500">
            {req.poNumber} · {formatDate(req.createdAt)}
            {req.expectedDate ? ` · needed by ${formatDate(req.expectedDate)}` : ""}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
            req.status === "AWAITING_CLIENT"
              ? "bg-[#D97706]/10 text-[#D97706]"
              : req.status === "CLIENT_DISPATCHED"
                ? "bg-success/10 text-success"
                : "bg-grey-100 text-grey-600",
          )}
        >
          {PO_STATUS_LABELS[req.status]}
        </span>
      </div>

      {req.note && <p className="mt-2 text-xs text-grey-500">{req.note}</p>}

      <ul className="mt-3 flex flex-col gap-1">
        {req.lines.map((line) => (
          <li key={line.itemId} className="flex items-center gap-2 text-sm text-grey-700">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
            <span className="min-w-0 flex-1 truncate">{line.itemName}</span>
            <span className="shrink-0 text-xs font-medium text-grey-600">
              {line.quantity} {line.unit}
            </span>
          </li>
        ))}
      </ul>

      {actionable && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <PackageCheck size={16} aria-hidden="true" />
            Review &amp; dispatch
          </button>
        </div>
      )}
    </div>
  );
}
