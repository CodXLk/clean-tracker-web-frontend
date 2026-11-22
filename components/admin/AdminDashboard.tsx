"use client";

import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlarmClockOff,
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarCheck2,
  ChevronRight,
  CircleAlert,
  Clock,
  Loader2,
  MapPin,
  Moon,
  MoveRight,
  PauseCircle,
  RefreshCw,
  Search,
  Sparkles,
  UserCog,
  Users2,
} from "lucide-react";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { DonutChart, type DonutSegment } from "@/components/charts/DonutChart";
import { TrendBarChart, type TrendBar } from "@/components/charts/TrendBarChart";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { useAdminDashboard } from "@/features/workforce/hooks/useAdminDashboard";
import { useOccurrences } from "@/features/workforce/hooks/useAssignments";
import { useComplaints } from "@/features/complaints/hooks/useComplaints";
import type { Complaint } from "@/features/complaints/schemas/complaint.schema";
import { useSiteDays } from "@/features/live-dashboard/hooks/useSiteDays";
import { ScheduleCellDetailModal } from "@/features/live-dashboard/components/ScheduleCellDetailModal";
import { LiveDot } from "@/features/live-dashboard/components/SiteDayDetails";
import type { SiteDay, SiteDayPerson, SiteDayStatus } from "@/features/live-dashboard/schemas/siteDay.schema";
import {
  PERSON_STATUS_META,
  SITE_DAY_STATUS_META,
  cleaningBucket,
  crossesMidnight,
  formatInstantOn,
  formatLocalTime,
  formatMinutes,
  formatWindow,
  inspectionBucket,
  isLateStart,
  minutesSince,
  openPause,
  weekdayShort,
} from "@/features/live-dashboard/lib/siteDayStatus";
import { todayISODate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const REFRESH_MS = 60 * 1000;
const DASH = "/admin/dashboard";
const siteHref = (id: string) => `${DASH}?tab=site-schedule&site=${id}`;
const cleanerHref = (id: string) => `${DASH}?tab=cleaners-schedule&cleaner=${id}`;
const supervisorHref = (id: string) => `${DASH}?tab=supervisor-schedule&supervisor=${id}`;

const CLEANING_COLORS = { pending: "#94A3B8", inProgress: "#F59E0B", incomplete: "#E11D48", completed: "#00A63E" };
const INSPECTION_COLORS = { pending: "#0EA5E9", inProgress: "#7C3AED", completed: "#00A63E" };

export const TH = "px-4 py-3 font-medium";
export const TD = "px-4 py-3 align-middle text-grey-700";

export function shiftISO(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Re-renders every {@code intervalMs} so "late by" / "paused for" stay current. */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function weekdayLabel(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { weekday: "short" });
}

export function timeAgo(iso: string | null | undefined, now: number): string {
  const mins = minutesSince(iso, now);
  if (mins == null) return "";
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

// ── Layout primitives ──────────────────────────────────────────────────────────

export function Panel({ title, icon: Icon, children, action, subtitle, delay = 0 }: {
  title: string;
  icon: typeof Activity;
  children: ReactNode;
  action?: ReactNode;
  subtitle?: string;
  delay?: number;
}) {
  return (
    <section
      className="dash-fade-up flex min-w-0 flex-col rounded-2xl bg-surface p-4 shadow-sm sm:p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-base font-semibold text-on-surface">
            <Icon className="h-4 w-4 text-grey-400" aria-hidden="true" /> {title}
          </h3>
          {subtitle && <p className="mt-0.5 text-xs text-grey-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function PanelLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-ink underline-offset-2 hover:underline">
      {children} <ArrowRight size={14} aria-hidden="true" />
    </Link>
  );
}

function StatusBadge({ status, label }: { status: SiteDayStatus; label?: string }) {
  const meta = SITE_DAY_STATUS_META[status];
  return (
    <span
      title={meta.description}
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        meta.cls,
      )}
    >
      {meta.live && <LiveDot />}
      <span className="truncate">{label ?? meta.label}</span>
    </span>
  );
}

export function FilterChips<T extends string>({ options, value, onChange }: {
  options: { id: T; label: string; count: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            value === o.id
              ? "border-ink bg-ink text-white"
              : "border-grey-200 text-grey-600 hover:border-grey-300 hover:bg-grey-50",
          )}
        >
          {o.label}
          <span className={cn("rounded-full px-1.5 text-xs", value === o.id ? "bg-white/25" : "bg-grey-100")}>
            {o.count}
          </span>
        </button>
      ))}
    </div>
  );
}

function PersonChip({ person, href, tz, date }: { person: SiteDayPerson; href: string; tz?: string | null; date: string }) {
  const meta = PERSON_STATUS_META[person.status];
  const pausedAt = openPause(person);
  return (
    <Link
      href={href}
      onClick={(e) => e.stopPropagation()}
      title={`${person.name} — ${meta.label}${pausedAt ? ` since ${formatInstantOn(pausedAt, tz, date)}` : ""}${person.expected ? "" : " (not on the schedule)"}`}
      className={cn(
        "inline-flex max-w-[12rem] items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-[filter] hover:brightness-95",
        meta.cls,
      )}
    >
      {person.status === "IN_PROGRESS" && <LiveDot />}
      {person.status === "PAUSED" && <PauseCircle size={12} aria-hidden="true" />}
      <span className="truncate">{person.name}</span>
      {person.forgotCheckout && <AlarmClockOff size={12} className="shrink-0 text-red-600" aria-label="Forgot check-out" />}
      {person.forcedCheckout && <CircleAlert size={12} className="shrink-0 text-rose-600" aria-label="Forced check-out" />}
    </Link>
  );
}

function People({ people, hrefOf, tz, date, empty }: {
  people: SiteDayPerson[];
  hrefOf: (id: string) => string;
  tz?: string | null;
  date: string;
  empty: string;
}) {
  if (people.length === 0) return <span className="text-grey-400">{empty}</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {people.map((p) => (
        <PersonChip key={p.id} person={p} tz={tz} date={date} href={hrefOf(p.id)} />
      ))}
    </div>
  );
}

function SiteName({ day, today, extra }: { day: SiteDay; today: string; extra?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      <Link
        href={siteHref(day.siteId)}
        onClick={(e) => e.stopPropagation()}
        className="truncate font-medium text-on-surface underline-offset-2 hover:underline"
        title="Open site schedule"
      >
        {day.siteName}
      </Link>
      {day.date !== today && (
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
          title={`Overnight shift that started ${weekdayShort(day.date)}`}
        >
          <Moon size={11} aria-hidden="true" /> From {weekdayShort(day.date)}
        </span>
      )}
      {extra}
    </div>
  );
}

/** A label/value pair for mobile cards. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-grey-500">{label}</p>
      <div className="truncate text-sm font-medium text-on-surface">{children}</div>
    </div>
  );
}

function TimeText({ iso, tz, date, open, openTone }: {
  iso?: string | null;
  tz?: string | null;
  date: string;
  open?: boolean;
  openTone?: string;
}) {
  if (iso) return <span className="whitespace-nowrap">{formatInstantOn(iso, tz, date)}</span>;
  if (open) return <span className={cn("whitespace-nowrap font-medium", openTone)}>On site</span>;
  return <span className="text-grey-400">—</span>;
}

/** Click + keyboard props for a card that contains its own links (so it can't be a <button>). */
export function cardProps(onActivate: () => void, label: string) {
  return {
    role: "button" as const,
    tabIndex: 0,
    "aria-label": label,
    onClick: onActivate,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.target !== e.currentTarget) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onActivate();
      }
    },
  };
}

export function EmptyRows({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-grey-200 px-3 py-8 text-center text-sm text-grey-500">{text}</p>
  );
}

function OpenButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-grey-400 transition-colors hover:bg-grey-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <ChevronRight size={18} aria-hidden="true" />
    </button>
  );
}

// ── Cleaning ───────────────────────────────────────────────────────────────────

type CleaningFilter = "all" | "pending" | "inProgress" | "done";

/** Badge for the cleaning list: the cleaning state, then the workflow once cleaning is done. */
function cleaningBadgeStatus(day: SiteDay): SiteDayStatus {
  switch (day.cleaningStatus) {
    case "IN_PROGRESS": return "CLEANING_IN_PROGRESS";
    case "PAUSED": return "CLEANING_PAUSED";
    case "INCOMPLETE": return "CLEANING_INCOMPLETE";
    case "COMPLETED":
      return day.status === "COMPLETED" || day.status === "INSPECTION_IN_PROGRESS" || day.status === "INSPECTION_PAUSED"
        ? day.status
        : "PENDING_INSPECTION";
    default: return "SCHEDULED";
  }
}

function cleaningOrder(day: SiteDay, now: number): number {
  switch (day.cleaningStatus) {
    case "PAUSED": return 0;
    case "IN_PROGRESS": return 1;
    case "PENDING": return isLateStart(day, now) ? 2 : 3;
    case "INCOMPLETE": return 4;
    default: return 5;
  }
}

/** Expected start, with where it came from and lateness. */
function StartInfo({ day, now }: { day: SiteDay; now: number }) {
  if (!day.expectedStart) return <span className="text-grey-400">—</span>;
  const late = isLateStart(day, now);
  const lateBy = late ? minutesSince(day.expectedStartAt, now) : null;
  const source = day.expectedSource === "SHIFT" ? "Shift" : day.expectedSource === "GENERAL" ? "Cleaning window" : "Tasks";
  const overnight = crossesMidnight(day.expectedStart, day.expectedEnd);
  return (
    <div className="min-w-0" title={`${source} ${formatWindow(day.expectedStart, day.expectedEnd)}`}>
      <span className={cn("whitespace-nowrap text-on-surface", late && "font-semibold")}>
        {formatLocalTime(day.expectedStart)}
      </span>
      {day.shiftMoved && day.originalStart && (
        <span className="ml-1.5 text-xs text-grey-400 line-through" title="Shift moved for this day">
          {formatLocalTime(day.originalStart)}
        </span>
      )}
      <p className="flex items-center gap-1 text-xs text-grey-500">
        {source}
        {overnight && <Moon size={11} aria-label="Overnight" />}
      </p>
      {late && lateBy != null && (
        <p className="text-xs font-medium text-ink">No check-in · {formatMinutes(lateBy)} late</p>
      )}
    </div>
  );
}

function PausedNote({ day, now, tone }: { day: SiteDay; now: number; tone: string }) {
  const paused = [...day.cleaners, ...day.supervisors].find((p) => p.status === "PAUSED");
  const at = paused ? openPause(paused) : null;
  if (!at) return null;
  return (
    <p className={cn("mt-1 text-xs", tone)}>
      Paused {formatInstantOn(at, day.timezone, day.date)} · {formatMinutes(minutesSince(at, now))}
    </p>
  );
}

function CleaningTable({ days, today, now, onOpen }: {
  days: SiteDay[];
  today: string;
  now: number;
  onOpen: (d: SiteDay) => void;
}) {
  const carried = (day: SiteDay) =>
    day.carriedFrom ? (
      <span
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
        title={`Unfinished ${weekdayShort(day.carriedFrom)} tasks carried over`}
      >
        <MoveRight size={11} aria-hidden="true" /> {weekdayShort(day.carriedFrom)} tasks
      </span>
    ) : null;

  return (
    <>
      {/* Desktop / tablet */}
      <div className="hidden max-h-[560px] overflow-auto rounded-xl border border-grey-200 md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-grey-200 bg-grey-50 text-xs uppercase tracking-wide text-grey-500">
            <tr>
              <th className={TH}>Site</th>
              <th className={TH}>Status</th>
              <th className={TH}>Cleaners</th>
              <th className={TH}>Start</th>
              <th className={TH}>Check-in</th>
              <th className={TH}>Check-out</th>
              <th className="w-10 px-2 py-3"><span className="sr-only">Details</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-grey-100">
            {days.map((day) => {
              const late = isLateStart(day, now);
              return (
                <tr
                  key={`${day.siteId}_${day.date}`}
                  onClick={() => onOpen(day)}
                  className={cn("cursor-pointer transition-colors hover:bg-grey-50", late && "bg-red-50/40")}
                >
                  <td className={cn(TD, "w-full max-w-0 min-w-[160px]")}>
                    <SiteName day={day} today={today} extra={carried(day)} />
                  </td>
                  <td className={TD}>
                    <StatusBadge status={cleaningBadgeStatus(day)} />
                    <PausedNote day={day} now={now} tone="text-ink" />
                  </td>
                  <td className={cn(TD, "max-w-[260px]")}>
                    <People people={day.cleaners} hrefOf={cleanerHref} tz={day.timezone} date={day.date} empty="Unassigned" />
                  </td>
                  <td className={TD}><StartInfo day={day} now={now} /></td>
                  <td className={TD}><TimeText iso={day.firstCheckInAt} tz={day.timezone} date={day.date} /></td>
                  <td className={TD}>
                    <TimeText iso={day.lastCheckOutAt} tz={day.timezone} date={day.date} open={Boolean(day.firstCheckInAt)} openTone="text-ink" />
                  </td>
                  <td className="px-2 py-3"><OpenButton label={`View ${day.siteName} details`} onClick={() => onOpen(day)} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <ul className="flex flex-col gap-2 md:hidden">
        {days.map((day) => (
          <li key={`${day.siteId}_${day.date}`}>
            <div
              {...cardProps(() => onOpen(day), `View ${day.siteName} details`)}
              className={cn(
                "flex w-full cursor-pointer flex-col gap-3 rounded-xl border border-grey-200 p-3 text-left transition-colors active:bg-grey-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isLateStart(day, now) && "border-red-200 bg-red-50/40",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 text-sm"><SiteName day={day} today={today} extra={carried(day)} /></div>
                <StatusBadge status={cleaningBadgeStatus(day)} />
              </div>
              <PausedNote day={day} now={now} tone="-mt-2 text-ink" />
              <People people={day.cleaners} hrefOf={cleanerHref} tz={day.timezone} date={day.date} empty="Unassigned" />
              <div className="grid grid-cols-3 gap-2 border-t border-grey-100 pt-2.5">
                <Field label="Start"><StartInfo day={day} now={now} /></Field>
                <Field label="Check-in"><TimeText iso={day.firstCheckInAt} tz={day.timezone} date={day.date} /></Field>
                <Field label="Check-out">
                  <TimeText iso={day.lastCheckOutAt} tz={day.timezone} date={day.date} open={Boolean(day.firstCheckInAt)} openTone="text-ink" />
                </Field>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

// ── Inspection ─────────────────────────────────────────────────────────────────

type InspectionFilter = "all" | "pending" | "inProgress" | "completed";

function inspectionBadgeStatus(day: SiteDay): SiteDayStatus {
  switch (day.inspectionStatus) {
    case "IN_PROGRESS": return "INSPECTION_IN_PROGRESS";
    case "PAUSED": return "INSPECTION_PAUSED";
    case "COMPLETED": return "COMPLETED";
    case "SKIPPED": return "INSPECTION_SKIPPED";
    default: return "INSPECTION_SCHEDULED";
  }
}

function inspectionTimes(day: SiteDay) {
  const sessions = day.supervisors.flatMap((p) => p.sessions);
  const ins = sessions.map((s) => s.checkInAt).filter((x): x is string => Boolean(x)).sort();
  const outs = sessions.map((s) => s.checkOutAt).filter((x): x is string => Boolean(x)).sort();
  const open = sessions.some((s) => !s.checkOutAt);
  return { firstIn: ins[0] ?? null, lastOut: open ? null : outs[outs.length - 1] ?? null, open };
}

function CleaningContext({ day }: { day: SiteDay }) {
  if (!day.cleaningScheduled) return <span className="text-grey-400">No cleaning</span>;
  const meta = SITE_DAY_STATUS_META[cleaningBadgeStatus(day)];
  return (
    <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium", meta.cls)}>
      {day.cleaningStatus === "COMPLETED" ? "Cleaned" : meta.label}
    </span>
  );
}

function InspectionTable({ days, today, now, onOpen }: {
  days: SiteDay[];
  today: string;
  now: number;
  onOpen: (d: SiteDay) => void;
}) {
  const unscheduled = (day: SiteDay) =>
    !day.inspectionScheduled ? (
      <span
        className="shrink-0 rounded-full bg-grey-100 px-2 py-0.5 text-xs font-medium text-grey-500"
        title="A supervisor visited without a scheduled inspection"
      >
        Unscheduled
      </span>
    ) : null;
  const label = (s: SiteDayStatus) => (s === "INSPECTION_SCHEDULED" ? "Pending" : undefined);

  return (
    <>
      <div className="hidden max-h-[480px] overflow-auto rounded-xl border border-grey-200 md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-grey-200 bg-grey-50 text-xs uppercase tracking-wide text-grey-500">
            <tr>
              <th className={TH}>Site</th>
              <th className={TH}>Status</th>
              <th className={TH}>Supervisors</th>
              <th className={TH}>Check-in</th>
              <th className={TH}>Check-out</th>
              <th className={TH}>Cleaning</th>
              <th className="w-10 px-2 py-3"><span className="sr-only">Details</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-grey-100">
            {days.map((day) => {
              const t = inspectionTimes(day);
              const status = inspectionBadgeStatus(day);
              return (
                <tr key={`${day.siteId}_${day.date}`} onClick={() => onOpen(day)} className="cursor-pointer transition-colors hover:bg-grey-50">
                  <td className={cn(TD, "w-full max-w-0 min-w-[160px]")}><SiteName day={day} today={today} extra={unscheduled(day)} /></td>
                  <td className={TD}>
                    <StatusBadge status={status} label={label(status)} />
                    <PausedNote day={{ ...day, cleaners: [] }} now={now} tone="text-ink" />
                  </td>
                  <td className={cn(TD, "max-w-[260px]")}>
                    <People people={day.supervisors} hrefOf={supervisorHref} tz={day.timezone} date={day.date} empty="—" />
                  </td>
                  <td className={TD}><TimeText iso={t.firstIn} tz={day.timezone} date={day.date} /></td>
                  <td className={TD}>
                    <TimeText iso={t.lastOut} tz={day.timezone} date={day.date} open={Boolean(t.firstIn)} openTone="text-ink" />
                  </td>
                  <td className={TD}><CleaningContext day={day} /></td>
                  <td className="px-2 py-3"><OpenButton label={`View ${day.siteName} details`} onClick={() => onOpen(day)} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-2 md:hidden">
        {days.map((day) => {
          const t = inspectionTimes(day);
          const status = inspectionBadgeStatus(day);
          return (
            <li key={`${day.siteId}_${day.date}`}>
              <div
                {...cardProps(() => onOpen(day), `View ${day.siteName} details`)}
                className="flex w-full cursor-pointer flex-col gap-3 rounded-xl border border-grey-200 p-3 text-left transition-colors active:bg-grey-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 text-sm"><SiteName day={day} today={today} extra={unscheduled(day)} /></div>
                  <StatusBadge status={status} label={label(status)} />
                </div>
                <People people={day.supervisors} hrefOf={supervisorHref} tz={day.timezone} date={day.date} empty="No supervisor yet" />
                <div className="grid grid-cols-3 gap-2 border-t border-grey-100 pt-2.5">
                  <Field label="Check-in"><TimeText iso={t.firstIn} tz={day.timezone} date={day.date} /></Field>
                  <Field label="Check-out">
                    <TimeText iso={t.lastOut} tz={day.timezone} date={day.date} open={Boolean(t.firstIn)} openTone="text-ink" />
                  </Field>
                  <Field label="Cleaning"><CleaningContext day={day} /></Field>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

// ── Complaints ─────────────────────────────────────────────────────────────────

export const COMPLAINT_STATUS: Record<Complaint["status"], { label: string; cls: string }> = {
  open: { label: "Open", cls: "bg-[#ED5F25]/15 text-[#C2410C]" },
  in_progress: { label: "In progress", cls: "bg-amber-100 text-amber-700" },
  closed: { label: "Awaiting review", cls: "bg-blue-100 text-blue-700" },
  resolved: { label: "Resolved", cls: "bg-emerald-100 text-emerald-700" },
};

export function ComplaintTile({ value, label, color, icon: Icon }: {
  value: number;
  label: string;
  color: string;
  icon: typeof Activity;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-grey-100 p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}1A` }}>
        <Icon className="h-4 w-4" style={{ color }} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-tight text-on-surface tabular-nums">{value}</p>
        <p className="truncate text-xs text-grey-500">{label}</p>
      </div>
    </div>
  );
}

function complaintDetails(c: Complaint): string {
  const where = [c.floor, c.area].filter(Boolean).join(" · ");
  return (
    [where, c.description, c.tasks.length > 0 ? `Tasks: ${c.tasks.map((t) => t.taskName).join(", ")}` : ""]
      .filter(Boolean)
      .join(" — ") || "No details"
  );
}

export function ComplaintsTable({ rows, now, onOpen }: { rows: Complaint[]; now: number; onOpen: (c: Complaint) => void }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-grey-200 md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-grey-200 bg-grey-50 text-xs uppercase tracking-wide text-grey-500">
            <tr>
              <th className={TH}>Site</th>
              <th className={TH}>Complaint</th>
              <th className={TH}>Priority</th>
              <th className={TH}>Status</th>
              <th className={TH}>Raised</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-grey-100">
            {rows.map((c) => {
              const st = COMPLAINT_STATUS[c.status];
              return (
                <tr key={c.id} onClick={() => onOpen(c)} className="cursor-pointer transition-colors hover:bg-grey-50">
                  <td className={cn(TD, "max-w-[200px] truncate font-medium text-on-surface")}>{c.site || "—"}</td>
                  <td className={cn(TD, "w-full max-w-0 min-w-[220px]")}>
                    <p className="truncate font-medium text-on-surface">
                      {c.title}
                      {c.code && <span className="ml-1.5 text-xs font-normal text-grey-400">#{c.code}</span>}
                    </p>
                    <p className="line-clamp-2 text-xs text-grey-500">{complaintDetails(c)}</p>
                  </td>
                  <td className={TD}><PriorityBadge priority={c.priority} /></td>
                  <td className={TD}>
                    <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium", st.cls)}>{st.label}</span>
                  </td>
                  <td className={TD}>
                    <span className="whitespace-nowrap">{timeAgo(c.reportedAt, now)}</span>
                    {c.reporterName && <p className="truncate text-xs text-grey-500">by {c.reporterName}</p>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-2 md:hidden">
        {rows.map((c) => {
          const st = COMPLAINT_STATUS[c.status];
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onOpen(c)}
                className="flex w-full flex-col gap-1.5 rounded-xl border border-grey-200 p-3 text-left transition-colors active:bg-grey-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-medium text-on-surface">{c.title}</p>
                  <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", st.cls)}>{st.label}</span>
                </div>
                <p className="text-xs text-grey-500">{c.site || "—"}{c.code ? ` · #${c.code}` : ""}</p>
                <p className="line-clamp-2 text-sm text-grey-700">{complaintDetails(c)}</p>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <PriorityBadge priority={c.priority} />
                  <span className="text-xs text-grey-500">
                    {timeAgo(c.reportedAt, now)}{c.reporterName ? ` · ${c.reporterName}` : ""}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export function AdminDashboard() {
  const today = todayISODate();
  const router = useRouter();
  const now = useNow(30 * 1000);
  const overview = useAdminDashboard();
  // Yesterday is included so an overnight shift still running after midnight stays on the board;
  // tomorrow covers sites whose zone is already a day ahead. The server marks each site's live day.
  const from = shiftISO(today, -1);
  const to = shiftISO(today, 1);
  const siteDaysQuery = useSiteDays({ from, to, refetchInterval: REFRESH_MS });
  const occurrencesQuery = useOccurrences({ from, to });
  const complaintsQuery = useComplaints();

  const [cleaningFilter, setCleaningFilter] = useState<CleaningFilter>("all");
  const [inspectionFilter, setInspectionFilter] = useState<InspectionFilter>("all");
  const [detail, setDetail] = useState<{ siteId: string; date: string } | null>(null);

  const currentDays = useMemo(() => (siteDaysQuery.data ?? []).filter((d) => d.current), [siteDaysQuery.data]);

  const cleaningDays = useMemo(
    () =>
      currentDays
        .filter((d) => d.cleaningScheduled)
        .sort((a, b) => cleaningOrder(a, now) - cleaningOrder(b, now) || a.siteName.localeCompare(b.siteName)),
    [currentDays, now],
  );
  const inspectionDays = useMemo(
    () =>
      currentDays
        .filter((d) => d.inspectionStatus !== "NONE")
        .sort((a, b) => {
          const order = { IN_PROGRESS: 0, PAUSED: 1, PENDING: 2, SKIPPED: 3, COMPLETED: 4, NONE: 5 } as const;
          return order[a.inspectionStatus] - order[b.inspectionStatus] || a.siteName.localeCompare(b.siteName);
        }),
    [currentDays],
  );

  const cleaningCounts = useMemo(() => {
    const c = { pending: 0, inProgress: 0, incomplete: 0, completed: 0, late: 0, paused: 0, forgot: 0, forced: 0, onSite: 0, notIn: 0 };
    for (const d of cleaningDays) {
      c[cleaningBucket(d)] += 1;
      if (isLateStart(d, now)) c.late += 1;
      if (d.cleaningStatus === "PAUSED") c.paused += 1;
      for (const p of d.cleaners) {
        if (p.forgotCheckout) c.forgot += 1;
        if (p.forcedCheckout) c.forced += 1;
        if (p.status === "IN_PROGRESS" || p.status === "PAUSED") c.onSite += 1;
        if (p.status === "PENDING" && p.expected) c.notIn += 1;
      }
    }
    return c;
  }, [cleaningDays, now]);

  const inspectionCounts = useMemo(() => {
    const c = { pending: 0, inProgress: 0, completed: 0, unscheduled: 0, onSite: 0, paused: 0, forgot: 0 };
    for (const d of inspectionDays) {
      c[inspectionBucket(d)] += 1;
      if (!d.inspectionScheduled) c.unscheduled += 1;
      for (const p of d.supervisors) {
        if (p.status === "IN_PROGRESS") c.onSite += 1;
        if (p.status === "PAUSED") c.paused += 1;
        if (p.forgotCheckout) c.forgot += 1;
      }
    }
    return c;
  }, [inspectionDays]);

  const visibleCleaning = useMemo(() => {
    if (cleaningFilter === "all") return cleaningDays;
    return cleaningDays.filter((d) => {
      const b = cleaningBucket(d);
      if (cleaningFilter === "pending") return b === "pending";
      if (cleaningFilter === "inProgress") return b === "inProgress" || b === "incomplete";
      return b === "completed";
    });
  }, [cleaningDays, cleaningFilter]);

  const visibleInspection = useMemo(
    () => (inspectionFilter === "all" ? inspectionDays : inspectionDays.filter((d) => inspectionBucket(d) === inspectionFilter)),
    [inspectionDays, inspectionFilter],
  );

  const complaints = useMemo(() => complaintsQuery.data?.complaints ?? [], [complaintsQuery.data]);
  const complaintCounts = useMemo(() => {
    const c = { open: 0, review: 0, resolved: 0 };
    for (const x of complaints) {
      if (x.status === "resolved") c.resolved += 1;
      else if (x.status === "closed") c.review += 1;
      else c.open += 1;
    }
    return c;
  }, [complaints]);
  const complaintRows = useMemo(() => {
    const rank = (s: Complaint["status"]) => (s === "open" || s === "in_progress" ? 0 : s === "closed" ? 1 : 2);
    return [...complaints]
      .sort((a, b) => rank(a.status) - rank(b.status) || b.reportedAt.localeCompare(a.reportedAt))
      .slice(0, 8);
  }, [complaints]);

  // The open modal follows each background refresh.
  const detailDay = useMemo(
    () => (detail ? (siteDaysQuery.data ?? []).find((d) => d.siteId === detail.siteId && d.date === detail.date) ?? null : null),
    [detail, siteDaysQuery.data],
  );
  const detailOccurrences = useMemo(
    () =>
      detailDay
        ? (occurrencesQuery.data ?? []).filter(
            (o) =>
              o.siteId === detailDay.siteId &&
              (o.date === detailDay.date ||
                (detailDay.carriedFrom != null && o.date === detailDay.carriedFrom && o.assignmentType === "GENERAL_TASK")),
          )
        : [],
    [detailDay, occurrencesQuery.data],
  );
  const detailComplaints = useMemo(
    () => (detailDay ? complaints.filter((c) => c.siteId === detailDay.siteId && c.tasks.some((t) => t.date === detailDay.date)) : []),
    [detailDay, complaints],
  );

  if (overview.isLoading) {
    return (
      <div className="flex justify-center py-20 text-grey-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (overview.isError || !overview.data) {
    return (
      <p className="rounded-2xl bg-error/10 px-4 py-3 text-sm font-medium text-error">
        Failed to load the dashboard.
      </p>
    );
  }

  const d = overview.data;
  const trend: TrendBar[] = d.weeklyTrend.map((t) => ({ label: weekdayLabel(t.date), total: t.total, completed: t.completed }));

  const cleaningSegments: DonutSegment[] = [
    { label: "Pending cleaning", value: cleaningCounts.pending, color: CLEANING_COLORS.pending },
    { label: "Cleaning in progress", value: cleaningCounts.inProgress, color: CLEANING_COLORS.inProgress },
    ...(cleaningCounts.incomplete > 0
      ? [{ label: "Checked out · tasks left", value: cleaningCounts.incomplete, color: CLEANING_COLORS.incomplete }]
      : []),
    { label: "Cleaning completed", value: cleaningCounts.completed, color: CLEANING_COLORS.completed },
  ];
  const inspectionSegments: DonutSegment[] = [
    { label: "Inspection pending", value: inspectionCounts.pending, color: INSPECTION_COLORS.pending },
    { label: "Inspection in progress", value: inspectionCounts.inProgress, color: INSPECTION_COLORS.inProgress },
    { label: "Inspection completed", value: inspectionCounts.completed, color: INSPECTION_COLORS.completed },
  ];
  const complaintSegments: DonutSegment[] = [
    { label: "Open", value: complaintCounts.open, color: "#ED5F25" },
    { label: "Awaiting review", value: complaintCounts.review, color: "#2B7FFF" },
    { label: "Resolved", value: complaintCounts.resolved, color: "#00A63E" },
  ];

  const statusLoading = siteDaysQuery.isLoading;
  const updatedAt = siteDaysQuery.dataUpdatedAt
    ? new Date(siteDaysQuery.dataUpdatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : null;
  const todayLabel = new Date(`${today}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long", day: "numeric", month: "long",
  });
  const openDetail = (day: SiteDay) => setDetail({ siteId: day.siteId, date: day.date });
  const spinner = (
    <div className="flex justify-center py-10 text-grey-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Today strip */}
      <div className="dash-fade-up flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-on-surface sm:text-xl">Today · {todayLabel}</h2>
          <p className="text-sm text-grey-500">
            {cleaningCounts.onSite} on site now · {cleaningCounts.notIn} cleaner{cleaningCounts.notIn === 1 ? "" : "s"} not checked in yet
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void siteDaysQuery.refetch();
            void overview.refetch();
            void complaintsQuery.refetch();
          }}
          className="inline-flex items-center gap-2 rounded-full border border-grey-200 bg-surface px-3 py-1.5 text-sm font-medium text-grey-600 shadow-sm transition-colors hover:border-ink hover:text-ink"
          title="Refresh now (auto-refreshes every minute)"
        >
          <span className="text-emerald-600"><LiveDot /></span>
          Live{updatedAt ? ` · ${updatedAt}` : ""}
          <RefreshCw size={14} className={cn(siteDaysQuery.isFetching && "animate-spin")} aria-hidden="true" />
        </button>
      </div>

      {/* Headline totals */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { href: "/admin/cleaner-management", icon: Users2, bg: "bg-primary/10", fg: "text-ink", value: d.totals.cleaners, label: "Total Cleaners", badge: undefined },
          { href: "/admin/users", icon: UserCog, bg: "bg-purple-100", fg: "text-purple-600", value: d.totals.supervisors, label: "Total Supervisors", badge: undefined },
          { href: "/admin/user-management/sites", icon: Building2, bg: "bg-[#2B7FFF]/10", fg: "text-[#2B7FFF]", value: d.totals.sites, label: "Total Sites", badge: undefined },
          {
            href: `${DASH}?tab=site-schedule`, icon: CalendarCheck2, bg: "bg-[#ED5F25]/10", fg: "text-[#ED5F25]",
            value: statusLoading ? "…" : cleaningDays.length, label: "Today's Sites",
            badge: cleaningCounts.inProgress > 0 ? `${cleaningCounts.inProgress} live` : undefined,
          },
        ].map((c, i) => (
          <Link
            key={c.label}
            href={c.href}
            className="dash-fade-up rounded-xl transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:rounded-2xl"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <AdminStatCard icon={c.icon} iconBg={c.bg} iconColor={c.fg} value={c.value} label={c.label} badge={c.badge} badgeColor="text-ink font-semibold" />
          </Link>
        ))}
      </div>

      {/* Cleaning — today */}
      <Panel
        title="Site cleaning status — today"
        subtitle="Driven by check-ins: a site stays Scheduled until a cleaner checks in."
        icon={Sparkles}
        delay={100}
        action={<PanelLink href={`${DASH}?tab=site-schedule`}>Site schedule</PanelLink>}
      >
        <div className="grid grid-cols-1 items-center gap-5 lg:grid-cols-2">
          <DonutChart
            segments={cleaningSegments}
            centerValue={statusLoading ? "…" : `${cleaningCounts.completed}/${cleaningDays.length}`}
            centerLabel="sites cleaned"
          />
          <div className="grid grid-cols-2 gap-3">
            <StatTile icon={Clock} tone="red" value={cleaningCounts.late} label="Late starts" hint="Start time passed and nobody has checked in" />
            <StatTile icon={PauseCircle} tone="orange" value={cleaningCounts.paused} label="Paused" hint="Cleaner left the site or the app closed" />
            <StatTile icon={AlarmClockOff} tone="red" value={cleaningCounts.forgot} label="Forgot to check out" hint="Closed automatically by the system" />
            <StatTile icon={CircleAlert} tone="rose" value={cleaningCounts.forced} label="Forced check-out" hint="Left with tasks or time remaining" />
          </div>
        </div>

        <div className="mt-5 flex min-w-0 flex-col gap-3 border-t border-grey-100 pt-4">
          <FilterChips<CleaningFilter>
            value={cleaningFilter}
            onChange={setCleaningFilter}
            options={[
              { id: "all", label: "All", count: cleaningDays.length },
              { id: "pending", label: "Pending cleaning", count: cleaningCounts.pending },
              { id: "inProgress", label: "Cleaning in progress", count: cleaningCounts.inProgress + cleaningCounts.incomplete },
              { id: "done", label: "Cleaning completed", count: cleaningCounts.completed },
            ]}
          />
          {statusLoading ? spinner : siteDaysQuery.isError ? (
            <EmptyRows text="Couldn't load today's site status." />
          ) : visibleCleaning.length === 0 ? (
            <EmptyRows text={cleaningDays.length === 0 ? "No sites are scheduled for cleaning today." : "No sites match this filter."} />
          ) : (
            <CleaningTable days={visibleCleaning} today={today} now={now} onOpen={openDetail} />
          )}
        </div>
      </Panel>

      {/* Inspection — today */}
      <Panel
        title="Site inspection status — today"
        subtitle="Scheduled inspections plus any site a supervisor has checked in to today."
        icon={Search}
        delay={150}
        action={<PanelLink href={`${DASH}?tab=supervisor-schedule`}>Supervisor schedule</PanelLink>}
      >
        <div className="grid grid-cols-1 items-center gap-5 lg:grid-cols-2">
          <DonutChart
            segments={inspectionSegments}
            centerValue={statusLoading ? "…" : `${inspectionCounts.completed}/${inspectionDays.length}`}
            centerLabel="inspected"
          />
          <div className="grid grid-cols-2 gap-3">
            <StatTile icon={UserCog} tone="violet" value={inspectionCounts.onSite} label="On site now" hint="Supervisors checked in" />
            <StatTile icon={PauseCircle} tone="fuchsia" value={inspectionCounts.paused} label="Paused" hint="Inspection session paused" />
            <StatTile icon={AlarmClockOff} tone="red" value={inspectionCounts.forgot} label="Forgot to check out" hint="Closed automatically by the system" />
            <StatTile icon={MapPin} tone="sky" value={inspectionCounts.unscheduled} label="Unscheduled visits" hint="Checked in without a scheduled inspection" />
          </div>
        </div>

        <div className="mt-5 flex min-w-0 flex-col gap-3 border-t border-grey-100 pt-4">
          <FilterChips<InspectionFilter>
            value={inspectionFilter}
            onChange={setInspectionFilter}
            options={[
              { id: "all", label: "All", count: inspectionDays.length },
              { id: "pending", label: "Inspection pending", count: inspectionCounts.pending },
              { id: "inProgress", label: "Inspection in progress", count: inspectionCounts.inProgress },
              { id: "completed", label: "Inspection completed", count: inspectionCounts.completed },
            ]}
          />
          {statusLoading ? spinner : siteDaysQuery.isError ? (
            <EmptyRows text="Couldn't load today's inspection status." />
          ) : visibleInspection.length === 0 ? (
            <EmptyRows text={inspectionDays.length === 0 ? "No inspections scheduled or visits today." : "No sites match this filter."} />
          ) : (
            <InspectionTable days={visibleInspection} today={today} now={now} onOpen={openDetail} />
          )}
        </div>
      </Panel>

      {/* Complaints */}
      <Panel
        title="Complaints"
        icon={AlertTriangle}
        delay={200}
        action={<PanelLink href="/admin/complaints">All complaints</PanelLink>}
      >
        <div className="grid grid-cols-1 items-center gap-5 lg:grid-cols-2">
          <DonutChart segments={complaintSegments} centerValue={complaints.length} centerLabel="total" />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <ComplaintTile icon={AlertTriangle} value={complaintCounts.open} label="Pending" color="#ED5F25" />
            <ComplaintTile icon={Clock} value={complaintCounts.review} label="Awaiting review" color="#2B7FFF" />
            <ComplaintTile icon={CalendarCheck2} value={complaintCounts.resolved} label="Resolved" color="#00A63E" />
          </div>
        </div>
        <div className="mt-5 border-t border-grey-100 pt-4">
          <div className="min-w-0">
            {complaintsQuery.isLoading ? spinner : complaintRows.length === 0 ? (
              <EmptyRows text="No complaints raised." />
            ) : (
              <ComplaintsTable rows={complaintRows} now={now} onOpen={(c) => router.push(`/admin/complaints?complaint=${c.id}`)} />
            )}
          </div>
        </div>
      </Panel>

      {/* Trend */}
      <Panel title="Task completion trend (7 days)" icon={Activity} delay={250}>
        {trend.length > 0 ? (
          <TrendBarChart data={trend} />
        ) : (
          <p className="py-8 text-center text-sm text-grey-500">No scheduled tasks in this period.</p>
        )}
        <p className="mt-3 text-xs text-grey-500">
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-primary align-middle" /> Completed vs
          <span className="mx-1 inline-block h-2 w-2 rounded-full bg-grey-200 align-middle" /> total per day
        </p>
      </Panel>

      <ScheduleCellDetailModal
        open={detailDay !== null}
        onClose={() => setDetail(null)}
        siteName={detailDay?.siteName ?? ""}
        date={detailDay?.date ?? today}
        occurrences={detailOccurrences}
        complaints={detailComplaints}
        siteDay={detailDay}
        onOpenCleaner={(id) => {
          setDetail(null);
          router.push(cleanerHref(id));
        }}
        onOpenSupervisor={(id) => {
          setDetail(null);
          router.push(supervisorHref(id));
        }}
      />
    </div>
  );
}

const TILE_TONES = {
  red: { bar: "before:bg-red-500", icon: "bg-red-50 text-red-600" },
  orange: { bar: "before:bg-orange-500", icon: "bg-orange-50 text-orange-600" },
  rose: { bar: "before:bg-rose-500", icon: "bg-rose-50 text-rose-600" },
  violet: { bar: "before:bg-violet-500", icon: "bg-violet-50 text-violet-600" },
  fuchsia: { bar: "before:bg-fuchsia-500", icon: "bg-fuchsia-50 text-fuchsia-600" },
  sky: { bar: "before:bg-sky-500", icon: "bg-sky-50 text-sky-600" },
} as const;

/** Exception counter beside the donut: white card with a coloured accent bar and icon. */
function StatTile({ icon: Icon, tone, value, label, hint }: {
  icon: typeof Activity;
  tone: keyof typeof TILE_TONES;
  value: number;
  label: string;
  hint: string;
}) {
  const active = value > 0;
  const t = TILE_TONES[tone];
  return (
    <div
      title={hint}
      className={cn(
        "relative flex min-w-0 items-center gap-3 overflow-hidden rounded-xl border border-grey-100 bg-surface p-3 pl-4 shadow-sm sm:p-4 sm:pl-5",
        "before:absolute before:inset-y-0 before:left-0 before:w-1",
        active ? t.bar : "before:bg-grey-200",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10",
          active ? t.icon : "bg-grey-100 text-grey-400",
        )}
      >
        <Icon size={18} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-tight text-on-surface tabular-nums sm:text-2xl">{value}</p>
        <p className="line-clamp-2 text-xs leading-snug text-grey-500 sm:text-sm">{label}</p>
      </div>
    </div>
  );
}
