"use client";

import { useMemo, useState } from "react";
import { Building2, CheckCircle2, Clock, MapPinOff, UserCheck, UserX } from "lucide-react";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { cn } from "@/lib/utils/cn";
import { useSites } from "@/features/user-management/hooks/useSites";
import { useOccurrences } from "@/features/workforce/hooks/useAssignments";
import { useAttendanceLogs } from "@/features/attendance/hooks/useAttendance";
import type { TaskOccurrence, AssignmentCleaner } from "@/features/workforce/schemas/assignment.schema";
import { todayISODate } from "@/lib/utils/format";

type Audience = "cleaners" | "supervisors";

interface OperationsOverviewTabProps {
  audience: Audience;
}

const ACTOR_NOUN: Record<Audience, { one: string; many: string }> = {
  cleaners: { one: "cleaner", many: "cleaners" },
  supervisors: { one: "supervisor", many: "supervisors" },
};

function actorName(a: AssignmentCleaner): string {
  const name = `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim();
  return name || "Unnamed";
}

/** "HH:mm[:ss]" → minutes since midnight; null when unparseable. */
function toMinutes(hhmm: string | null | undefined): number | null {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":");
  const hours = Number(h);
  const mins = Number(m);
  if (Number.isNaN(hours) || Number.isNaN(mins)) return null;
  return hours * 60 + mins;
}

const ACTIVE_STATUSES = new Set(["SCHEDULED", "ACTIVE", "IN_PROGRESS"]);

/**
 * Today's live operational picture for one audience (cleaners or supervisors): a per-site summary
 * of who reported, task progress, who's outstanding, and the day's pending tasks. Derived purely
 * from today's occurrences and attendance logs — no dedicated backend endpoint.
 */
export function OperationsOverviewTab({ audience }: OperationsOverviewTabProps) {
  const today = todayISODate();
  const noun = ACTOR_NOUN[audience];

  const sitesQuery = useSites();
  const [siteId, setSiteId] = useState<string>("all");
  const scopedSiteId = siteId === "all" ? undefined : siteId;

  const occurrencesQuery = useOccurrences({ from: today, to: today, siteId: scopedSiteId });
  const logsQuery = useAttendanceLogs({ from: today, to: today, siteId: scopedSiteId });

  const sites = sitesQuery.data ?? [];
  const occurrences = useMemo(() => occurrencesQuery.data ?? [], [occurrencesQuery.data]);
  const logs = useMemo(() => logsQuery.data ?? [], [logsQuery.data]);

  // Check-in lookup for this audience: actorId → reported (has a check-in today).
  const reportedIds = useMemo(() => {
    const role = audience === "cleaners" ? "CLEANER" : "SUPERVISOR";
    const ids = new Set<string>();
    for (const log of logs) {
      if (log.actorRole === role && log.cleanerId && log.checkInAt) ids.add(log.cleanerId);
    }
    return ids;
  }, [logs, audience]);

  const nowMinutes = useMemo(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }, []);

  // Assigned actors today, with their earliest task start and reported flag.
  const actorRows = useMemo(() => {
    const map = new Map<string, { id: string; name: string; earliestStart: number | null; reported: boolean }>();
    for (const o of occurrences) {
      const people = audience === "cleaners" ? o.cleaners : o.supervisors;
      const start = toMinutes(o.shiftStartTime ?? o.startTime);
      for (const p of people) {
        const existing = map.get(p.id);
        if (existing) {
          if (start != null && (existing.earliestStart == null || start < existing.earliestStart)) {
            existing.earliestStart = start;
          }
        } else {
          map.set(p.id, {
            id: p.id,
            name: actorName(p),
            earliestStart: start,
            reported: reportedIds.has(p.id),
          });
        }
      }
    }
    return [...map.values()];
  }, [occurrences, audience, reportedIds]);

  const summary = useMemo(() => {
    const totalTasks = occurrences.filter((o) => o.status !== "CANCELLED").length;
    const completedTasks = occurrences.filter((o) => o.status === "COMPLETED").length;
    const remainingTasks = occurrences.filter((o) => ACTIVE_STATUSES.has(o.status)).length;

    const reported = actorRows.filter((a) => a.reported).length;
    const notReported = actorRows.filter(
      (a) => !a.reported && (a.earliestStart == null || a.earliestStart <= nowMinutes),
    );
    const planned = actorRows.filter(
      (a) => !a.reported && a.earliestStart != null && a.earliestStart > nowMinutes,
    );
    return {
      assigned: actorRows.length,
      reported,
      totalTasks,
      completedTasks,
      remainingTasks,
      notReported,
      planned,
    };
  }, [occurrences, actorRows, nowMinutes]);

  const pendingTasks = useMemo(
    () =>
      occurrences
        .filter((o) => ACTIVE_STATUSES.has(o.status))
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [occurrences],
  );

  const isLoading = occurrencesQuery.isLoading || logsQuery.isLoading || sitesQuery.isLoading;

  return (
    <div className="flex flex-col gap-6">
      {/* Site filter */}
      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <label htmlFor="ops-site" className="text-xs font-semibold uppercase tracking-wide text-grey-500">
          Site
        </label>
        <div className="relative">
          <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grey-400" aria-hidden="true" />
          <select
            id="ops-site"
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            className="h-11 w-full appearance-none rounded-xl border border-grey-300 bg-surface pl-9 pr-9 text-sm font-medium text-on-surface transition-colors hover:border-grey-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All sites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size={28} />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-5">
            <AdminStatCard
              icon={UserCheck}
              iconBg="bg-primary/10"
              iconColor="text-ink"
              value={`${summary.reported}/${summary.assigned}`}
              label={`Reported to work`}
            />
            <AdminStatCard
              icon={CheckCircle2}
              iconBg="bg-success/10"
              iconColor="text-success"
              value={summary.completedTasks}
              label="Tasks completed"
            />
            <AdminStatCard
              icon={Clock}
              iconBg="bg-[#ED5F25]/10"
              iconColor="text-[#ED5F25]"
              value={summary.remainingTasks}
              label="Tasks remaining"
            />
            <AdminStatCard
              icon={UserX}
              iconBg="bg-error/10"
              iconColor="text-error"
              value={summary.notReported.length}
              label={`Not reported yet`}
            />
            <AdminStatCard
              icon={MapPinOff}
              iconBg="bg-grey-100"
              iconColor="text-grey-500"
              value={summary.planned.length}
              label="Planned (shift to start)"
            />
          </div>

          {/* Outstanding people */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <PeopleCard
              title={`Not reported yet`}
              emptyText={`Every assigned ${noun.one} on shift has checked in.`}
              tone="error"
              people={summary.notReported.map((a) => ({ id: a.id, name: a.name }))}
            />
            <PeopleCard
              title="Planned — shift hasn't started"
              emptyText={`No upcoming ${noun.one} shifts remain today.`}
              tone="neutral"
              people={summary.planned.map((a) => ({
                id: a.id,
                name: a.name,
                hint: a.earliestStart != null ? minutesToLabel(a.earliestStart) : undefined,
              }))}
            />
          </div>

          {/* Pending tasks */}
          <div>
            <h2 className="mb-3 text-base font-semibold text-on-surface">
              Pending tasks{" "}
              <span className="ml-1 rounded-full bg-grey-100 px-2 py-0.5 text-xs font-medium text-grey-600">
                {pendingTasks.length}
              </span>
            </h2>
            {pendingTasks.length === 0 ? (
              <EmptyState title="No pending tasks" description="Everything scheduled today is done." />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-grey-200 bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-grey-200 text-left text-xs font-semibold uppercase tracking-wide text-grey-500">
                      <th className="px-4 py-3">Task</th>
                      <th className="px-4 py-3">Site · Area</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">{noun.many === "cleaners" ? "Cleaners" : "Supervisors"}</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingTasks.map((o) => (
                      <PendingRow key={`${o.taskId}|${o.occurrenceDate}`} o={o} audience={audience} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function minutesToLabel(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${`${h}`.padStart(2, "0")}:${`${m}`.padStart(2, "0")}`;
}

function PeopleCard({
  title,
  emptyText,
  tone,
  people,
}: {
  title: string;
  emptyText: string;
  tone: "error" | "neutral";
  people: Array<{ id: string; name: string; hint?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-grey-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-on-surface">{title}</h3>
      {people.length === 0 ? (
        <p className="rounded-lg bg-grey-50 px-3 py-3 text-center text-xs text-grey-500">{emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {people.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm text-on-surface">
                <span
                  className={cn(
                    "inline-block h-2 w-2 rounded-full",
                    tone === "error" ? "bg-error" : "bg-grey-400",
                  )}
                />
                {p.name}
              </span>
              {p.hint && <span className="text-xs font-medium text-grey-500">from {p.hint}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-grey-100 text-grey-600",
  ACTIVE: "bg-primary/10 text-ink",
  IN_PROGRESS: "bg-[#ED5F25]/10 text-[#ED5F25]",
};

function PendingRow({ o, audience }: { o: TaskOccurrence; audience: Audience }) {
  const people = audience === "cleaners" ? o.cleaners : o.supervisors;
  const names = people.map(actorName).join(", ") || "—";
  return (
    <tr className="border-b border-grey-100 last:border-b-0">
      <td className="px-4 py-3 font-medium text-on-surface">{o.name}</td>
      <td className="px-4 py-3 text-grey-500">
        {o.siteName} · {o.areaName}
      </td>
      <td className="px-4 py-3 text-grey-600">{o.startTime.slice(0, 5)}</td>
      <td className="px-4 py-3 text-grey-600">{names}</td>
      <td className="px-4 py-3">
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium",
            STATUS_STYLES[o.status] ?? "bg-grey-100 text-grey-600",
          )}
        >
          {o.status.replace("_", " ").toLowerCase()}
        </span>
      </td>
    </tr>
  );
}
