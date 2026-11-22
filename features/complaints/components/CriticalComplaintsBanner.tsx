"use client";

import Link from "next/link";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { useComplaints } from "@/features/complaints/hooks/useComplaints";

interface CriticalComplaintsBannerProps {
  /** Only complaints at this site (omit for every site). */
  siteId?: string;
  className?: string;
}

/**
 * Open critical (client) complaints assigned to the cleaner. They must be completed before any other
 * task at the site — the server rejects task completion until they're done.
 */
export function CriticalComplaintsBanner({ siteId, className }: CriticalComplaintsBannerProps) {
  const { data } = useComplaints();
  const critical = (data?.complaints ?? []).filter(
    (c) => c.critical && c.status === "open" && (!siteId || c.siteId === siteId),
  );
  if (critical.length === 0) return null;

  return (
    <div role="alert" className={`rounded-xl border border-red-300 bg-red-50 px-3 py-2.5 ${className ?? ""}`}>
      <p className="flex items-center gap-1.5 text-xs font-semibold text-red-700">
        <ShieldAlert size={14} className="shrink-0" aria-hidden="true" />
        Client complaint{critical.length > 1 ? "s" : ""} — complete first
      </p>
      <p className="mt-1 text-[11px] text-red-700/80">
        Complete {critical.length > 1 ? "these" : "this"} before your other tasks at the site.
      </p>
      <ul className="mt-1.5 flex flex-col gap-1">
        {critical.slice(0, 4).map((c) => (
          <li key={c.id}>
            <Link
              href={`/admin/complaints?complaint=${c.id}`}
              className="flex items-center justify-between gap-2 rounded-lg bg-white/80 px-2.5 py-1.5 text-xs font-medium text-on-surface transition-colors hover:bg-white"
            >
              <span className="min-w-0 truncate">
                {c.title}
                {!siteId && c.site ? <span className="text-grey-500"> · {c.site}</span> : null}
              </span>
              <span className="inline-flex shrink-0 items-center gap-0.5 text-red-700">
                Complete <ArrowRight size={12} aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
        {critical.length > 4 && <li className="text-[11px] text-red-700/80">and {critical.length - 4} more…</li>}
      </ul>
    </div>
  );
}
