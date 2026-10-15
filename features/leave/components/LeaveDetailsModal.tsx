"use client";

import { useMemo } from "react";
import { X, Sparkles, ShieldCheck, Check, Clock, UserX } from "lucide-react";
import { ModalPortal } from "@/components/shared/ModalPortal";
import type { CoverRole, LeaveRequest } from "@/features/leave/schemas/leave.schema";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-success/10 text-success",
  REJECTED: "bg-error/10 text-error",
  CANCELLED: "bg-grey-100 text-grey-500",
};

/**
 * Read-only breakdown of a leave request: every affected site split into its cleaning and
 * supervising cover, who is covering it, and whether they've accepted.
 */
export function LeaveDetailsModal({ leave, onClose }: { leave: LeaveRequest; onClose: () => void }) {
  const coverByKey = useMemo(() => {
    const map = new Map<string, (typeof leave.covers)[number]>();
    for (const c of leave.covers) map.set(`${c.siteId}:${c.coverRole}`, c);
    return map;
  }, [leave.covers]);

  const cleaning = leave.affectedSites.filter((s) => s.coverRole === "CLEANING");
  const supervising = leave.affectedSites.filter((s) => s.coverRole === "SUPERVISING");

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-on-surface">{leave.requesterName}</h2>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[leave.status] ?? "bg-grey-100 text-grey-600"}`}>
                  {leave.status}
                </span>
              </div>
              <p className="text-xs text-grey-500">
                {leave.requesterRole === "SUPERVISOR" ? "Supervisor" : "Cleaner"} · {leave.startDate} → {leave.endDate}
                {leave.type === "SITE_SPECIFIC" ? " · Specific sites" : " · All sites"}
              </p>
              {leave.reason && <p className="mt-1 text-xs italic text-grey-500">“{leave.reason}”</p>}
            </div>
            <button type="button" aria-label="Close" onClick={onClose} className="rounded-full p-1 text-grey-400 hover:bg-grey-100">
              <X size={18} />
            </button>
          </div>

          {leave.affectedSites.length === 0 ? (
            <p className="rounded-xl border border-dashed border-grey-200 px-3 py-6 text-center text-sm text-grey-500">
              No scheduled sites fall within this leave period.
            </p>
          ) : (
            <div className="flex max-h-[26rem] flex-col gap-4 overflow-y-auto">
              <CoverGroup
                title="Cleaning"
                tone="sky"
                icon={<Sparkles size={12} />}
                sites={cleaning}
                coverByKey={coverByKey}
              />
              <CoverGroup
                title="Supervising"
                tone="violet"
                icon={<ShieldCheck size={12} />}
                sites={supervising}
                coverByKey={coverByKey}
              />
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button type="button" onClick={onClose} className="rounded-full border border-grey-300 px-4 py-2 text-sm font-medium text-on-surface hover:bg-grey-50">
              Close
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

function CoverGroup({
  title,
  tone,
  icon,
  sites,
  coverByKey,
}: {
  title: string;
  tone: "sky" | "violet";
  icon: React.ReactNode;
  sites: LeaveRequest["affectedSites"];
  coverByKey: Map<string, LeaveRequest["covers"][number]>;
}) {
  if (sites.length === 0) return null;
  const chip = tone === "violet" ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700";
  return (
    <div>
      <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-grey-600">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${chip}`}>
          {icon} {title}
        </span>
        <span className="text-grey-400">· {sites.length} site{sites.length > 1 ? "s" : ""}</span>
      </p>
      <ul className="flex flex-col gap-2">
        {sites.map((s) => {
          const cover = coverByKey.get(`${s.siteId}:${s.coverRole as CoverRole}`);
          return (
            <li key={`${s.siteId}:${s.coverRole}`} className="flex items-center justify-between gap-3 rounded-xl border border-grey-200 px-3 py-2">
              <span className="truncate text-sm font-medium text-on-surface">{s.siteName}</span>
              {cover ? (
                <span className="flex shrink-0 items-center gap-2 text-sm text-grey-700">
                  <span className="truncate">{cover.coveringName}</span>
                  {cover.approvalStatus === "APPROVED" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                      <Check size={10} /> Accepted
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      <Clock size={10} /> Pending
                    </span>
                  )}
                </span>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-grey-100 px-2 py-0.5 text-[10px] font-semibold text-grey-500">
                  <UserX size={10} /> No cover yet
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
