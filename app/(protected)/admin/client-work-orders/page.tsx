"use client";

import { useMemo, useState } from "react";
import { Briefcase, CalendarDays, Clock, Plus } from "lucide-react";
import { useIsDrawerNav } from "@/components/layout/AppNav";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { Modal } from "@/components/shared/Modal";
import { SearchInput } from "@/components/shared/SearchInput";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import { useWorkOrders } from "@/features/work-orders/hooks/useWorkOrders";
import { ClientWorkOrderFormModal } from "@/features/work-orders/components/ClientWorkOrderFormModal";
import { ClientReviewForm, ClientReviewList } from "@/features/work-orders/components/ClientWorkOrderReview";
import type { WorkOrder, WorkOrderStatus } from "@/features/work-orders/schemas/workOrder.schema";
import { cn } from "@/lib/utils/cn";

/** Client-facing wording for each stage of a work order. */
const CLIENT_STATUS: Record<WorkOrderStatus, { label: string; cls: string }> = {
  PENDING: { label: "Pending review", cls: "bg-grey-100 text-grey-700" },
  APPROVED: { label: "Approved", cls: "bg-sky-100 text-sky-700" },
  ONGOING: { label: "In progress", cls: "bg-amber-100 text-amber-700" },
  TASKS_COMPLETED: { label: "Work done", cls: "bg-blue-100 text-blue-700" },
  PENDING_REVIEW: { label: "Awaiting your review", cls: "bg-violet-100 text-violet-700" },
  COMPLETED: { label: "Completed", cls: "bg-emerald-100 text-emerald-700" },
};

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function formatWindow(w: WorkOrder): string {
  if (!w.startTime) return "Any time";
  const fmt = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  };
  return w.endTime ? `${fmt(w.startTime)} – ${fmt(w.endTime)}` : `From ${fmt(w.startTime)}`;
}

function StatusPill({ status, changesRequested }: { status: WorkOrderStatus; changesRequested?: boolean }) {
  const s = changesRequested
    ? { label: "Changes requested", cls: "bg-amber-100 text-amber-700" }
    : CLIENT_STATUS[status];
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium", s.cls)}>{s.label}</span>;
}

export default function ClientWorkOrdersPage() {
  const useDrawerNav = useIsDrawerNav();
  const query = useWorkOrders();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<WorkOrder | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = query.data ?? [];
    return q
      ? list.filter((w) => w.poId.toLowerCase().includes(q) || (w.siteName ?? "").toLowerCase().includes(q))
      : list;
  }, [query.data, search]);

  return (
    <>
      {!useDrawerNav && (
        <div className="lg:hidden">
          <PageHeader title="Work Orders" />
        </div>
      )}

      <div className={cn("px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8", !useDrawerNav ? "pb-28 lg:pb-8" : "pb-6 lg:pb-8")}>
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-grey-500">Extra work you&apos;ve requested at your sites.</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <SearchInput value={search} onChange={setSearch} placeholder="Search PO or site…" className="sm:w-64" />
              <button
                type="button"
                onClick={() => setFormOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <Plus size={16} aria-hidden="true" /> Work order
              </button>
            </div>
          </div>

          {notice && (
            <p role="status" className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
              {notice}
            </p>
          )}

          {query.isLoading ? (
            <div className="flex justify-center py-16"><LoadingSpinner /></div>
          ) : query.isError ? (
            <EmptyState title="Couldn't load work orders" description="Please try again in a moment." />
          ) : rows.length === 0 ? (
            <EmptyState
              title={search ? "No matching work orders" : "No work orders yet"}
              description={search ? "Try a different search." : "Request extra work at any of your sites with + Work order."}
            />
          ) : (
            <>
              <div className="hidden overflow-x-auto rounded-2xl bg-surface shadow-sm md:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-grey-200 bg-grey-50 text-xs uppercase tracking-wide text-grey-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">PO</th>
                      <th className="px-4 py-3 font-medium">Site</th>
                      <th className="px-4 py-3 font-medium">What needs to be done</th>
                      <th className="px-4 py-3 font-medium">Start</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-grey-100">
                    {rows.map((w) => (
                      <tr key={w.id} onClick={() => setDetail(w)} className="cursor-pointer transition-colors hover:bg-grey-50">
                        <td className="px-4 py-3 font-medium text-on-surface">{w.poId}</td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-grey-700">{w.siteName ?? "—"}</td>
                        <td className="max-w-[360px] px-4 py-3 text-grey-700">
                          <p className="line-clamp-2">{w.description ?? "—"}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-grey-700">{formatDate(w.startDate)}</td>
                        <td className="px-4 py-3"><StatusPill status={w.status} changesRequested={w.changesRequested} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="flex flex-col gap-2 md:hidden">
                {rows.map((w) => (
                  <li key={w.id}>
                    <button
                      type="button"
                      onClick={() => setDetail(w)}
                      className="flex w-full flex-col gap-1.5 rounded-2xl bg-surface p-4 text-left shadow-sm active:bg-grey-50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-on-surface">{w.poId}</p>
                        <StatusPill status={w.status} changesRequested={w.changesRequested} />
                      </div>
                      <p className="text-xs text-grey-500">{w.siteName ?? "—"} · {formatDate(w.startDate)}</p>
                      {w.description && <p className="line-clamp-2 text-sm text-grey-700">{w.description}</p>}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <ClientWorkOrderFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={(w) => setNotice(`Work order ${w.poId} sent. We'll review it and confirm the details.`)}
      />

      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail ? `Work order ${detail.poId}` : ""}
        description={detail?.siteName ?? undefined}
        maxWidthClassName="max-w-lg"
      >
        {detail && (
          <div className="flex flex-col gap-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={detail.status} changesRequested={detail.changesRequested} />
              <span className="inline-flex items-center gap-1 text-xs text-grey-500">
                <Briefcase size={13} aria-hidden="true" /> Requested {formatDate(detail.createdAt)}
              </span>
            </div>
            <section>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-grey-500">What needs to be done</p>
              <p className="whitespace-pre-line rounded-xl bg-grey-50 px-3.5 py-3 text-on-surface">{detail.description ?? "—"}</p>
            </section>
            {detail.photos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {detail.photos.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setLightbox(`/api/work-orders/photos/${p.id}`)}
                    className="h-20 w-20 overflow-hidden rounded-lg border border-grey-200"
                    aria-label="View photo"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/work-orders/photos/${p.id}`} alt={p.originalFilename ?? "Work order photo"} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="flex items-center gap-1 text-xs text-grey-500"><CalendarDays size={13} aria-hidden="true" /> Start date</p>
                <p className="font-medium text-on-surface">{formatDate(detail.startDate)}</p>
              </div>
              <div>
                <p className="flex items-center gap-1 text-xs text-grey-500"><Clock size={13} aria-hidden="true" /> Work window</p>
                <p className="font-medium text-on-surface">{formatWindow(detail)}</p>
              </div>
            </div>
            {detail.startNote && (
              <section>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-grey-500">Start date notes</p>
                <p className="whitespace-pre-line rounded-xl bg-sky-50 px-3.5 py-3 text-on-surface">{detail.startNote}</p>
              </section>
            )}
            {detail.status === "PENDING_REVIEW" && !detail.changesRequested && (
              <ClientReviewForm
                workOrder={detail}
                onDone={(saved) => {
                  setDetail(saved);
                  setNotice(saved.status === "COMPLETED"
                    ? `Thanks — work order ${saved.poId} is approved and completed.`
                    : `Thanks — we've sent your requested changes for ${saved.poId} to the team.`);
                }}
              />
            )}
            {detail.changesRequested && (
              <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
                You asked for changes. We&apos;ll let you know when the work is ready for your review again.
              </p>
            )}
            <ClientReviewList reviews={detail.clientReviews} title="Your reviews" />
          </div>
        )}
      </Modal>

      <ImageLightbox src={lightbox} onClose={() => setLightbox(null)} />
    </>
  );
}