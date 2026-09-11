"use client";

import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Search, X, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PillButton } from "@/components/shared/PillButton";
import { useMySites } from "@/features/attendance/hooks/useAttendance";
import {
  useInventoryItems,
  useCreateRequest,
  useSiteInventory,
  useMyCleanerInventory,
} from "@/features/inventory/hooks/useInventory";
import type { RequestType } from "@/features/inventory/schemas/inventory.schema";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";

interface RequestItemsModalProps {
  open:     boolean;
  onClose:  () => void;
}

const TYPE_OPTIONS: { value: RequestType; label: string }[] = [
  { value: "SITE", label: "For the site" },
  { value: "CLEANER", label: "For myself" },
];

type Step = "confirm" | "request";

export function RequestItemsModal({ open, onClose }: RequestItemsModalProps) {
  const sitesQuery = useMySites();
  const itemsQuery = useInventoryItems(true);
  const createMutation = useCreateRequest();

  const [step,        setStep]        = useState<Step>("confirm");
  const [siteId,      setSiteId]      = useState("");
  const [requestType, setRequestType] = useState<RequestType>("SITE");
  const [search,      setSearch]      = useState("");
  const [note,        setNote]        = useState("");
  const [confirmQty,  setConfirmQty]  = useState<Record<string, number>>({});
  const [requestQty,  setRequestQty]  = useState<Record<string, number>>({});
  const [error,       setError]       = useState<string | null>(null);

  // Current stock for the chosen context: the site's stock, or the cleaner's own stock.
  const siteInvQuery = useSiteInventory(requestType === "SITE" ? siteId || undefined : undefined);
  const myInvQuery = useMyCleanerInventory();

  const sites = useMemo(() => sitesQuery.data ?? [], [sitesQuery.data]);
  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);

  const currentStock = useMemo(() => {
    const map = new Map<string, number>();
    if (requestType === "SITE") {
      for (const row of siteInvQuery.data ?? []) map.set(row.itemId, row.quantity);
    } else {
      for (const row of myInvQuery.data?.items ?? []) map.set(row.itemId, row.quantity);
    }
    return map;
  }, [requestType, siteInvQuery.data, myInvQuery.data]);

  const stockLoading = requestType === "SITE" ? siteInvQuery.isLoading : myInvQuery.isLoading;
  const contextReady = !itemsQuery.isLoading && (requestType === "CLEANER" || !!siteId) && !stockLoading;

  useEffect(() => {
    if (open) {
      setStep("confirm");
      setSearch("");
      setNote("");
      setConfirmQty({});
      setRequestQty({});
      setError(null);
      setRequestType("SITE");
      createMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Default the site to the cleaner's only/first site.
  useEffect(() => {
    if (open && !siteId && sites.length > 0) {
      setSiteId(sites[0].siteId);
    }
  }, [open, siteId, sites]);

  // Pre-load every item's quantity with its current stock whenever the context
  // (type / site) changes and the stock has finished loading. A key gate keeps
  // background refetches from clobbering the cleaner's edits.
  const syncKey = `${requestType}:${siteId}:${contextReady ? "ready" : "loading"}`;
  const [syncedKey, setSyncedKey] = useState<string | null>(null);
  useEffect(() => {
    if (!open || !contextReady || syncedKey === syncKey) return;
    setSyncedKey(syncKey);
    const next: Record<string, number> = {};
    for (const item of items) next[item.id] = currentStock.get(item.id) ?? 0;
    setConfirmQty(next);
  }, [open, contextReady, syncKey, syncedKey, items, currentStock]);
  useEffect(() => {
    if (!open) setSyncedKey(null);
  }, [open]);

  if (!open) return null;

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  const requestCount = items.filter((item) => (requestQty[item.id] ?? 0) > 0).length;

  const activeQty = step === "confirm" ? confirmQty : requestQty;
  const setActiveQty = step === "confirm" ? setConfirmQty : setRequestQty;
  function setQty(id: string, value: number) {
    const q = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
    setActiveQty((prev) => ({ ...prev, [id]: q }));
  }

  function handleSubmit() {
    setError(null);
    if (!siteId) {
      setError("Select a site to request items for.");
      return;
    }
    const lines = items
      .filter((item) => (requestQty[item.id] ?? 0) > 0)
      .map((item) => ({ itemId: item.id, requestedQuantity: requestQty[item.id] }));
    if (lines.length === 0) {
      setError("Set a quantity for at least one item you need.");
      return;
    }
    // Confirm the on-hand counts for items the target currently holds.
    const confirmedStock = Array.from(currentStock.keys()).map((itemId) => ({
      itemId,
      quantity: confirmQty[itemId] ?? currentStock.get(itemId) ?? 0,
    }));
    createMutation.mutate(
      {
        siteId,
        requestType,
        // CLEANER requests default to the requester's own cleaner profile on the backend.
        note: note.trim() || undefined,
        confirmedStock,
        lines,
      },
      { onSuccess: onClose },
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Request items"
        className={cn(
          "fixed z-50 bg-white p-6",
          "inset-x-0 bottom-0 rounded-t-3xl min-h-[50vh] max-h-[85vh] overflow-y-auto",
          "lg:inset-0 lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:min-h-0 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-md lg:rounded-3xl lg:shadow-2xl",
        )}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step === "request" && (
              <button
                onClick={() => setStep("confirm")}
                aria-label="Back to confirm stock"
                className="rounded-full p-0.5 text-grey-500 transition-colors hover:bg-grey-100 hover:text-ink"
              >
                <ArrowLeft size={20} strokeWidth={2} />
              </button>
            )}
            <h2 className="text-xl font-bold text-on-surface">
              {step === "confirm" ? "Confirm current stock" : "Request items"}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full p-0.5 text-danger transition-colors hover:bg-danger/10"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="mb-4 flex items-center gap-2 text-xs font-medium">
          <span className={cn("rounded-full px-2.5 py-1", step === "confirm" ? "bg-primary text-white" : "bg-grey-100 text-grey-500")}>
            1 · Confirm stock
          </span>
          <span className="text-grey-300">→</span>
          <span className={cn("rounded-full px-2.5 py-1", step === "request" ? "bg-primary text-white" : "bg-grey-100 text-grey-500")}>
            2 · Request items
          </span>
        </div>

        {/* Request type */}
        <div className="mb-4">
          <span className="mb-1.5 block text-xs font-medium text-grey-700">Request for</span>
          <div className="flex gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setRequestType(opt.value);
                  setStep("confirm");
                  setRequestQty({});
                }}
                disabled={step === "request"}
                className={cn(
                  "flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60",
                  requestType === opt.value
                    ? "border-primary bg-primary text-white"
                    : "border-grey-300 text-on-surface hover:bg-grey-100",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-grey-500">
            {step === "confirm"
              ? requestType === "SITE"
                ? "Check the site's current stock and correct any quantities before requesting."
                : "Check your current stock and correct any quantities before requesting."
              : "Enter how much of each item you need."}
          </p>
        </div>

        {/* Site selector (shown when the cleaner covers more than one site) */}
        {sites.length > 1 && step === "confirm" && (
          <div className="mb-4">
            <label htmlFor="request-site" className="mb-1 block text-xs font-medium text-grey-700">
              Site
            </label>
            <select
              id="request-site"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="w-full rounded-xl border border-grey-300 bg-white px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
            >
              {sites.map((site) => (
                <option key={site.siteId} value={site.siteId}>
                  {site.siteName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Search */}
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-grey-100 px-3 py-2">
          <Search size={16} className="shrink-0 text-grey-500" />
          <input
            type="text"
            placeholder="Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-grey-500 outline-none"
          />
        </div>

        {/* Item list — every item, quantity pre-loaded with current stock */}
        <div className="mb-5 flex flex-col gap-1.5">
          {itemsQuery.isLoading || stockLoading ? (
            <p className="py-4 text-center text-sm text-grey-500">Loading stock…</p>
          ) : filtered.length === 0 ? (
            <p className="py-4 text-center text-sm text-grey-500">No items found.</p>
          ) : (
            filtered.map((item) => {
              const qty = activeQty[item.id] ?? 0;
              const inStock = currentStock.get(item.id) ?? 0;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-2"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-on-surface">{item.name}</span>
                    <span className="text-[11px] text-grey-500">
                      {step === "confirm" ? "Recorded" : "In stock"}: {inStock} {item.unit}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => setQty(item.id, qty - 1)}
                      aria-label={`Remove one ${item.name}`}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-grey-100 text-on-surface hover:bg-grey-200"
                    >
                      <Minus size={12} strokeWidth={2.5} />
                    </button>
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      aria-label={`Quantity for ${item.name}`}
                      value={qty}
                      onChange={(e) => setQty(item.id, e.target.valueAsNumber)}
                      className="w-14 rounded-lg border border-grey-300 px-2 py-1 text-center text-sm text-on-surface outline-none focus:border-primary"
                    />
                    <button
                      onClick={() => setQty(item.id, qty + 1)}
                      aria-label={`Add one ${item.name}`}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white"
                    >
                      <Plus size={12} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Note (request step only) */}
        {step === "request" && (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)"
            rows={2}
            maxLength={1000}
            className="mb-3 w-full resize-none rounded-xl border border-grey-300 p-3 text-sm text-on-surface outline-none focus:border-primary"
          />
        )}

        {(error || createMutation.isError) && (
          <p role="alert" className="mb-3 rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
            {error ?? getErrorMessage(createMutation.error)}
          </p>
        )}

        {/* Footer */}
        {step === "confirm" ? (
          <PillButton
            variant="teal"
            className="w-full"
            onClick={() => {
              if (!siteId) {
                setError("Select a site first.");
                return;
              }
              setError(null);
              setStep("request");
            }}
            disabled={!contextReady}
          >
            Confirm stock &amp; continue →
          </PillButton>
        ) : (
          <PillButton
            variant="teal"
            className="w-full"
            onClick={handleSubmit}
            disabled={requestCount === 0 || createMutation.isPending}
          >
            {createMutation.isPending ? "Submitting…" : `Confirm & Send (${requestCount})`}
          </PillButton>
        )}

        <p className="mt-3 text-center text-xs text-grey-500">
          Requests will be reviewed by your supervisor.
        </p>
      </div>
    </>
  );
}
