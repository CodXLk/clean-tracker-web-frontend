"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, Clock, ListChecks, Hash, X, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import {
  WORK_ORDER_STATUS_LABELS,
  type WorkOrder,
  type WorkOrderStatus,
} from "@/features/work-orders/schemas/workOrder.schema";

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

function photoUrl(photoId: string): string {
  return `/api/work-orders/photos/${photoId}`;
}

const STATUS_STYLES: Record<WorkOrderStatus, string> = {
  PENDING: "bg-grey-100 text-grey-600",
  APPROVED: "bg-blue-100 text-blue-700",
  ONGOING: "bg-amber-100 text-amber-700",
  PENDING_REVIEW: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-success/10 text-success",
};

interface WorkOrderDetailModalProps {
  open: boolean;
  onClose: () => void;
  workOrder: WorkOrder | null;
}

export function WorkOrderDetailModal({ open, onClose, workOrder }: WorkOrderDetailModalProps) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  if (!workOrder) return null;

  const photos = workOrder.photos;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Work order ${workOrder.poId}`}
      description={workOrder.siteName ?? undefined}
      maxWidthClassName="max-w-2xl"
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[workOrder.status]}`}>
            {WORK_ORDER_STATUS_LABELS[workOrder.status]}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={<Hash size={15} />} label="PO ID" value={workOrder.poId} />
          <StatCard icon={<Calendar size={15} />} label="Start date" value={formatDate(workOrder.startDate)} />
          <StatCard
            icon={<Clock size={15} />}
            label="Duration"
            value={workOrder.expectedDurationDays ? `${workOrder.expectedDurationDays} day(s)` : "—"}
          />
          <StatCard icon={<ListChecks size={15} />} label="Tasks" value={String(workOrder.taskCount)} />
        </div>

        {workOrder.description && (
          <section>
            <SectionTitle>Scope</SectionTitle>
            <p className="rounded-xl bg-grey-50 px-3.5 py-3 text-sm leading-relaxed text-on-surface">
              {workOrder.description}
            </p>
          </section>
        )}

        <section>
          <SectionTitle>Photos from the client</SectionTitle>
          {photos.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-grey-200 px-3.5 py-4 text-sm text-grey-500">
              <ImageOff size={16} aria-hidden="true" />
              No photos attached.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setLightbox(i)}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-grey-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl(p.id)}
                    alt={p.originalFilename ?? "Work order photo"}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SlotList
            title="Cleaner slots"
            rows={workOrder.cleanerProfiles.map((p) => ({ label: p.label, name: p.cleanerName }))}
          />
          <SlotList
            title="Supervisor slots"
            rows={workOrder.supervisorProfiles.map((p) => ({ label: p.label, name: p.supervisorName }))}
          />
        </div>
      </div>

      {lightbox !== null && photos[lightbox] && (
        <Lightbox
          photos={photos.map((p) => ({ id: p.id, name: p.originalFilename ?? undefined }))}
          index={lightbox}
          onIndexChange={setLightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </Modal>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-grey-500">{children}</p>;
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-grey-200 bg-white px-3 py-2.5">
      <div className="mb-0.5 flex items-center gap-1.5 text-grey-500">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="truncate text-sm font-semibold text-on-surface" title={value}>
        {value}
      </p>
    </div>
  );
}

function SlotList({ title, rows }: { title: string; rows: Array<{ label: string; name?: string | null }> }) {
  return (
    <div>
      <SectionTitle>{title}</SectionTitle>
      <ul className="flex flex-col gap-1">
        {rows.length === 0 && (
          <li className="rounded-lg bg-grey-50 px-2.5 py-1.5 text-sm text-grey-500">None</li>
        )}
        {rows.map((r, i) => (
          <li key={i} className="flex items-center justify-between gap-2 rounded-lg bg-grey-50 px-2.5 py-1.5">
            <span className="text-sm text-on-surface">{r.label}</span>
            <span className={`shrink-0 text-xs ${r.name ? "font-medium text-on-surface" : "text-grey-400"}`}>
              {r.name ?? "Unassigned"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Full-screen photo viewer with prev/next navigation. */
function Lightbox({
  photos,
  index,
  onIndexChange,
  onClose,
}: {
  photos: Array<{ id: string; name?: string }>;
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const current = photos[index]!;
  const many = photos.length > 1;
  const go = (delta: number) => onIndexChange((index + delta + photos.length) % photos.length);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        if (many && e.key === "ArrowLeft") go(-1);
        if (many && e.key === "ArrowRight") go(1);
      }}
      tabIndex={-1}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <X size={20} aria-hidden="true" />
      </button>

      {many && (
        <button
          type="button"
          aria-label="Previous photo"
          onClick={(e) => { e.stopPropagation(); go(-1); }}
          className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <ChevronLeft size={24} aria-hidden="true" />
        </button>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoUrl(current.id)}
        alt={current.name ?? "Work order photo"}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
      />

      {many && (
        <button
          type="button"
          aria-label="Next photo"
          onClick={(e) => { e.stopPropagation(); go(1); }}
          className="absolute right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <ChevronRight size={24} aria-hidden="true" />
        </button>
      )}

      {many && (
        <span className="absolute bottom-5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
          {index + 1} / {photos.length}
        </span>
      )}
    </div>,
    document.body,
  );
}

