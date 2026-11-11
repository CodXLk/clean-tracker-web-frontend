"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useSiteShiftContext } from "@/features/shifts/hooks/useShiftPlans";
import {
  ShiftPlanEditor,
  SiteShiftFacts,
  initialPlan,
  planProblems,
} from "@/features/shifts/components/ShiftPlanEditor";
import { formatPlanDay, type ShiftPlan, type ShiftPlanInput } from "@/features/shifts/schemas/shiftPlan.schema";

interface ShiftPlanDialogProps {
  open: boolean;
  onClose: () => void;
  siteId: string | null;
  title: string;
  description?: string;
  submitLabel: string;
  /** Seed from a specific plan (e.g. editing a pending change) instead of the site's current ones. */
  existing?: ShiftPlan | null;
  onSubmit: (plan: ShiftPlanInput) => Promise<unknown>;
}

/** Loads the site's shift context and lets a cleaner propose (or re-send) their shifts. */
export function ShiftPlanDialog({
  open,
  onClose,
  siteId,
  title,
  description,
  submitLabel,
  existing,
  onSubmit,
}: ShiftPlanDialogProps) {
  const ctxQuery = useSiteShiftContext(open ? siteId : null);
  const ctx = ctxQuery.data;
  const [plan, setPlan] = useState<ShiftPlanInput | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const value = plan ?? (ctx ? initialPlan(ctx, existing) : null);
  const problems = ctx && value ? planProblems(ctx, value) : [];

  async function submit() {
    if (!value || problems.length > 0) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ ...value, note: note.trim() || undefined });
      onClose();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title} description={description} maxWidthClassName="max-w-xl">
      {ctxQuery.isLoading || !ctx || !value ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-grey-400" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <SiteShiftFacts ctx={ctx} />
          {ctx.approvedPlan && (
            <p className="text-xs text-grey-500">
              Your approved shifts here: {ctx.approvedPlan.days.map(formatPlanDay).join(" · ")}. Sending them unchanged
              needs no approval.
            </p>
          )}
          {ctx.pendingPlan && (
            <p className="text-xs text-amber-700">
              Awaiting approval: {ctx.pendingPlan.days.map(formatPlanDay).join(" · ")}. Sending again replaces it.
            </p>
          )}
          <ShiftPlanEditor ctx={ctx} value={value} onChange={setPlan} />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
            rows={2}
            placeholder="Note for the approver (optional)"
            className="rounded-xl border border-grey-300 px-3 py-2 text-sm"
          />
          {problems.length > 0 && (
            <ul className="list-disc rounded-xl bg-amber-50 px-6 py-2 text-xs text-amber-800">
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm font-semibold text-grey-600">
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || problems.length > 0}
              onClick={submit}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {submitLabel}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
