"use client";

import { useState } from "react";
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useCertificateWaiver, useSetCertificateWaiver } from "@/features/users/hooks/useCertificateWaiver";
import { formatDateTime } from "@/lib/utils/format";

function fmt(iso?: string | null): string {
  return formatDateTime(iso) || "—";
}

const STATUS_LABEL: Record<string, string> = { ACTIVE: "Active", ENDED: "Ended early", EXPIRED: "Expired" };

/**
 * Company/super admins: temporarily waive a cleaner's or supervisor's certificate checks so they can be
 * assigned to sites and work orders while their documents are pending. Other management sees the status.
 */
export function CertificateWaiverPanel({ userId }: { userId: string }) {
  const status = useCertificateWaiver(userId);
  const setWaiver = useSetCertificateWaiver();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const s = status.data;
  if (status.isLoading || status.isError || !s || !s.applicable) return null;

  async function change(waive: boolean) {
    setError(null);
    try {
      await setWaiver.mutateAsync({ userId, waive, note: note.trim() || undefined });
      setNote("");
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border p-3 ${
        s.active ? "border-amber-200 bg-amber-50" : "border-grey-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-on-surface">
            {s.active ? (
              <ShieldAlert className="h-4 w-4 text-amber-700" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-grey-500" />
            )}
            Certificate checks {s.active ? `waived until ${fmt(s.expiresAt)}` : "apply"}
          </p>
          <p className="mt-0.5 text-xs text-grey-600">
            {s.active
              ? "They can be assigned to any site or work order without the required certificates. When the waiver ends, existing assignments stay but new ones need the certificates again."
              : `A company or super admin can waive the checks for ${s.waiverDays} days so they can be assigned while their documents are reviewed.`}
          </p>
          {s.missingCertificates.length > 0 ? (
            <p className="mt-1 text-xs text-error">Still missing: {s.missingCertificates.join(", ")}</p>
          ) : (
            <p className="mt-1 text-xs text-success">All required certificates are verified.</p>
          )}
        </div>
        {s.canManage && (
          <div className="flex shrink-0 items-center gap-2">
            {s.active && (
              <button
                type="button"
                disabled={setWaiver.isPending}
                onClick={() => change(false)}
                className="rounded-full border border-grey-300 px-3 py-1.5 text-xs font-semibold text-error hover:bg-grey-50 disabled:opacity-50"
              >
                End now
              </button>
            )}
            <button
              type="button"
              disabled={setWaiver.isPending}
              onClick={() => change(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {setWaiver.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {s.active ? `Renew for ${s.waiverDays} days` : `Waive for ${s.waiverDays} days`}
            </button>
          </div>
        )}
      </div>
      {s.canManage && (
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
          placeholder="Reason (optional), e.g. police check submitted, awaiting result"
          className="h-9 rounded-lg border border-grey-300 bg-white px-3 text-xs"
        />
      )}
      {error && <p className="text-xs text-error">{error}</p>}
      {s.history.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="text-xs font-medium text-ink underline"
          >
            {showHistory ? "Hide history" : `History (${s.history.length})`}
          </button>
          {showHistory && (
            <ul className="mt-1.5 flex flex-col gap-1 text-[11px] text-grey-700">
              {s.history.map((h) => (
                <li key={h.id}>
                  <span className="font-medium">{STATUS_LABEL[h.status] ?? h.status}</span> · waived{" "}
                  {fmt(h.grantedAt)} by {h.grantedByName || "—"} until {fmt(h.expiresAt)}
                  {h.endedAt ? ` · ended ${fmt(h.endedAt)}${h.endedByName ? ` by ${h.endedByName}` : ""}` : ""}
                  {h.note ? ` · “${h.note}”` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
