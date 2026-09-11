"use client";

import { useEffect, useMemo, useState } from "react";
import { PackageCheck } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import {
  useClientInventoryRequests,
  useClientDispatchRequest,
} from "@/features/inventory/hooks/useInventory";
import { StatusBadge } from "@/features/inventory/components/StatusBadge";
import { fmtQty } from "@/features/inventory/lib/inventory";
import type { InventoryRequest } from "@/features/inventory/schemas/inventory.schema";

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

/** Client-facing view of client-sourced item requests: review requested items and dispatch to the site. */
export function ClientInventoryRequests() {
  const query = useClientInventoryRequests();
  const [active, setActive] = useState<InventoryRequest | null>(null);

  const requests = query.data ?? [];
  const pending = useMemo(() => requests.filter((r) => r.status === "APPROVED"), [requests]);
  const history = useMemo(() => requests.filter((r) => r.status === "FULFILLED"), [requests]);

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner />
      </div>
    );
  }
  if (pending.length === 0 && history.length === 0) return null;

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-sm font-semibold text-on-surface">Item stock requests</h2>
        <p className="text-xs text-grey-500">
          Requests for stock you supply. Review the items, adjust quantities and dispatch to the site.
        </p>
      </div>

      {pending.length > 0 && (
        <div className="flex flex-col gap-3">
          {pending.map((req) => (
            <RequestCard key={req.id} req={req} onAction={() => setActive(req)} actionable />
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-grey-500">Dispatched</h3>
          <div className="flex flex-col gap-3">
            {history.map((req) => (
              <RequestCard key={req.id} req={req} />
            ))}
          </div>
        </div>
      )}

      <ClientRequestDispatchModal open={!!active} onClose={() => setActive(null)} request={active} />
    </section>
  );
}

function RequestCard({
  req,
  onAction,
  actionable = false,
}: {
  req: InventoryRequest;
  onAction?: () => void;
  actionable?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-grey-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-on-surface">{req.siteName}</p>
          <p className="text-xs text-grey-500">Raised {formatDate(req.createdAt)}</p>
        </div>
        <StatusBadge status={req.status} />
      </div>

      {req.note && <p className="mt-2 text-xs text-grey-500">“{req.note}”</p>}

      <ul className="mt-3 flex flex-col gap-1">
        {req.lines.map((line) => (
          <li key={line.itemId} className="flex items-center gap-2 text-sm text-grey-700">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
            <span className="min-w-0 flex-1 truncate">{line.itemName}</span>
            <span className="shrink-0 text-xs font-medium text-grey-600">
              {fmtQty(line.requestedQuantity)} {line.unit}
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

function ClientRequestDispatchModal({
  open,
  onClose,
  request,
}: {
  open: boolean;
  onClose: () => void;
  request: InventoryRequest | null;
}) {
  const dispatch = useClientDispatchRequest();
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && request) {
      setQuantities(Object.fromEntries(request.lines.map((l) => [l.itemId, String(l.requestedQuantity)])));
      setNote("");
      setError(null);
      dispatch.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, request]);

  if (!request) return null;

  function submit() {
    if (!request) return;
    setError(null);
    const lines = request.lines
      .map((l) => ({ itemId: l.itemId, quantity: parseFloat(quantities[l.itemId] ?? "0") || 0 }))
      .filter((l) => l.quantity > 0);
    if (lines.length === 0) {
      setError("Dispatch at least one item with a quantity.");
      return;
    }
    dispatch.mutate({ id: request.id, note: note.trim() || undefined, lines }, { onSuccess: onClose });
  }

  return (
    <Modal open={open} onClose={onClose} title={`Dispatch to ${request.siteName}`} description="Adjust quantities you're sending, then dispatch.">
      <div className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-xl border border-grey-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-grey-50 text-xs uppercase tracking-wide text-grey-500">
              <tr>
                <th className="px-4 py-2 font-medium">Item</th>
                <th className="px-4 py-2 text-right font-medium">Requested</th>
                <th className="px-4 py-2 text-right font-medium">Dispatch</th>
              </tr>
            </thead>
            <tbody>
              {request.lines.map((l) => (
                <tr key={l.itemId} className="border-t border-grey-100">
                  <td className="px-4 py-2 text-on-surface">{l.itemName}</td>
                  <td className="px-4 py-2 text-right text-grey-500">
                    {fmtQty(l.requestedQuantity)} {l.unit}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={quantities[l.itemId] ?? ""}
                      onChange={(e) => setQuantities((p) => ({ ...p, [l.itemId]: e.target.value }))}
                      aria-label={`Dispatch quantity for ${l.itemName}`}
                      className="h-9 w-24 rounded-lg border border-grey-300 bg-white px-2 text-right text-sm outline-none focus:border-primary"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note (optional)"
          rows={2}
          maxLength={1000}
          className="w-full resize-none rounded-xl border border-grey-300 p-3 text-sm text-on-surface outline-none focus:border-primary"
        />

        {(error || dispatch.isError) && (
          <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
            {error ?? getErrorMessage(dispatch.error)}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-grey-300 px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={dispatch.isPending}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {dispatch.isPending ? "Dispatching…" : "Dispatch to site"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
