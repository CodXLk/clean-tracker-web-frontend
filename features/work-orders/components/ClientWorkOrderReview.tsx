"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ImagePlus, MessageSquareWarning, X } from "lucide-react";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useClientReviewWorkOrder } from "@/features/work-orders/hooks/useWorkOrders";
import type { WorkOrder, WorkOrderClientReview } from "@/features/work-orders/schemas/workOrder.schema";
import { cn } from "@/lib/utils/cn";

const MAX_PHOTOS = 10;

function when(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/** The client's reviews of a work order (decision, note, photos), newest first. Shown to staff and the client. */
export function ClientReviewList({ reviews, title = "Client review" }: { reviews: WorkOrderClientReview[]; title?: string }) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  if (reviews.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-grey-500">{title}</p>
      {[...reviews].reverse().map((r) => {
        const approved = r.decision === "APPROVED";
        return (
          <div key={r.id} className={cn("rounded-xl border px-3.5 py-3",
            approved ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200 bg-amber-50/60")}>
            <p className={cn("flex items-center gap-1.5 text-sm font-semibold", approved ? "text-emerald-700" : "text-amber-700")}>
              {approved ? <CheckCircle2 size={15} aria-hidden="true" /> : <MessageSquareWarning size={15} aria-hidden="true" />}
              {approved ? "Approved" : "Changes requested"}
            </p>
            <p className="text-xs text-grey-500">{r.reviewerName ?? "Client"} · {when(r.createdAt)}</p>
            {r.note && <p className="mt-1.5 whitespace-pre-line text-sm text-on-surface">{r.note}</p>}
            {r.photos.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {r.photos.map((p) => (
                  <button key={p.id} type="button" onClick={() => setLightbox(`/api/work-orders/review-photos/${p.id}`)}
                    className="h-16 w-16 overflow-hidden rounded-lg border border-grey-200" aria-label="View review photo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/work-orders/review-photos/${p.id}`} alt={p.originalFilename ?? "Review photo"}
                      className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <ImageLightbox src={lightbox} onClose={() => setLightbox(null)} />
    </section>
  );
}

/** Client: approve the finished work, or ask for changes with a note and photos. */
export function ClientReviewForm({ workOrder, onDone }: { workOrder: WorkOrder; onDone: (saved: WorkOrder) => void }) {
  const review = useClientReviewWorkOrder();
  const [decision, setDecision] = useState<"APPROVED" | "CHANGES_REQUESTED">("APPROVED");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const previews = useMemo(() => files.map((f) => ({ file: f, url: URL.createObjectURL(f) })), [files]);
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const images = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => [...prev, ...images].slice(0, MAX_PHOTOS));
  }

  async function submit() {
    setError(null);
    if (decision === "CHANGES_REQUESTED" && !note.trim()) {
      setError("Tell us what needs to be changed.");
      return;
    }
    try {
      const saved = await review.mutateAsync({ id: workOrder.id, decision, note, files });
      onDone(saved);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-violet-200 bg-violet-50/50 p-3.5">
      <p className="text-sm font-semibold text-on-surface">Review the completed work</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Your decision">
        {([["APPROVED", "Approve the work"], ["CHANGES_REQUESTED", "Ask for changes"]] as const).map(([value, label]) => (
          <button key={value} type="button" role="radio" aria-checked={decision === value} onClick={() => setDecision(value)}
            className={cn("rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              decision === value ? "border-primary bg-primary/10 text-primary" : "border-grey-300 bg-white text-on-surface hover:bg-grey-100")}>
            {label}
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1 text-xs text-grey-600">
        {decision === "APPROVED" ? "Comments (optional)" : "What needs to be changed?"}
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={2000}
          className="rounded-lg border border-grey-300 bg-white p-2 text-sm text-on-surface" />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        {previews.map((p, i) => (
          <div key={p.url} className="relative h-16 w-16 overflow-hidden rounded-lg border border-grey-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={p.file.name} className="h-full w-full object-cover" />
            <button type="button" onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} aria-label="Remove photo"
              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white">
              <X size={12} />
            </button>
          </div>
        ))}
        {files.length < MAX_PHOTOS && (
          <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-grey-300 bg-white text-[10px] text-grey-500 hover:bg-grey-50">
            <ImagePlus size={18} aria-hidden="true" />
            Add photo
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          </label>
        )}
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
      <button type="button" onClick={submit} disabled={review.isPending}
        className="self-start rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
        {review.isPending ? "Sending…" : decision === "APPROVED" ? "Approve work order" : "Send change request"}
      </button>
    </section>
  );
}
