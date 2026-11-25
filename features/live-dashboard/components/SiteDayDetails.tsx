"use client";

import {
  AlarmClockOff,
  ArrowRight,
  CalendarClock,
  CircleAlert,
  Clock,
  LogIn,
  LogOut,
  MoveRight,
  PauseCircle,
  Search,
  Sparkles,
} from "lucide-react";
import type { SiteDay, SiteDayPerson, SiteDaySession } from "@/features/live-dashboard/schemas/siteDay.schema";
import {
  CLEANING_STATUS_LABEL,
  CLOSE_REASON_LABEL,
  INSPECTION_STATUS_LABEL,
  PAUSE_REASON_LABEL,
  PERSON_STATUS_META,
  SITE_DAY_STATUS_META,
  type DayStatusKey,
  expectedStartLabel,
  formatInstantOn,
  formatWindow,
  formatLocalTime,
  formatMinutes,
  weekdayShort,
} from "@/features/live-dashboard/lib/siteDayStatus";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";

interface SiteDayDetailsProps {
  day: SiteDay;
  onOpenCleaner?: (id: string) => void;
  onOpenSupervisor?: (id: string) => void;
}

/** Cleaning + inspection breakdown for one site-day: who was expected, who came, and every session. */
export function SiteDayDetails({ day, onOpenCleaner, onOpenSupervisor }: SiteDayDetailsProps) {
  const meta = SITE_DAY_STATUS_META[day.status];
  const tz = day.timezone;
  const pct = day.totalTasks > 0 ? Math.round((day.completedTasks / day.totalTasks) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold", meta.cls)}>
          {meta.live && <LiveDot />}
          {meta.label}
        </span>
        {day.carriedFrom && (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
            <MoveRight size={13} aria-hidden="true" /> Carried from {weekdayShort(day.carriedFrom)}
          </span>
        )}
        {day.carriedTo && (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
            <ArrowRight size={13} aria-hidden="true" /> Carried to {weekdayShort(day.carriedTo)} {formatDate(day.carriedTo)}
          </span>
        )}
        {day.inspectedOn && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <Search size={13} aria-hidden="true" /> Inspected on {weekdayShort(day.inspectedOn)} {formatDate(day.inspectedOn)}
          </span>
        )}
      </div>
      <p className="-mt-2 text-xs text-grey-500">{meta.description}</p>

      {/* Cleaning */}
      {day.cleaningScheduled && (
        <section className="rounded-xl border border-grey-200">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-grey-200 bg-grey-50 px-3 py-2">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-on-surface">
              <Sparkles size={15} className="text-amber-500" aria-hidden="true" /> Cleaning
            </h3>
            <span className="text-xs font-medium text-grey-600">{CLEANING_STATUS_LABEL[day.cleaningStatus]}</span>
          </header>
          <div className="flex flex-col gap-2 px-3 py-2.5 text-xs text-grey-600">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {day.expectedStart && (
                <span className="inline-flex items-center gap-1">
                  <CalendarClock size={13} aria-hidden="true" /> {expectedStartLabel(day)}
                  {day.shiftMoved && day.originalStart && (
                    <span className="text-grey-400 line-through">{formatLocalTime(day.originalStart)}</span>
                  )}
                </span>
              )}
              {day.generalStart && day.expectedSource === "SHIFT" && (
                <span>
                  Cleaning window {formatWindow(day.generalStart, day.generalEnd)}
                </span>
              )}
            </div>
            {day.totalTasks > 0 && (
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-grey-100">
                  <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-700" style={{ width: `${pct}%` }} />
                </div>
                <span className="shrink-0 font-semibold text-on-surface">
                  {day.completedTasks}/{day.totalTasks} tasks
                </span>
              </div>
            )}
          </div>
          <PeopleList people={day.cleaners} tz={tz} date={day.date} empty="No cleaners assigned." onOpen={onOpenCleaner} showShift />
        </section>
      )}

      {/* Inspection */}
      {(day.inspectionScheduled || day.supervisors.length > 0 || day.inspectedOn) && (
        <section className="rounded-xl border border-grey-200">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-grey-200 bg-grey-50 px-3 py-2">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-on-surface">
              <Search size={15} className="text-violet-500" aria-hidden="true" /> Inspection
            </h3>
            <span className="text-xs font-medium text-grey-600">
              {INSPECTION_STATUS_LABEL[day.inspectionStatus]}
              {day.inspectedOn && ` · on ${formatDate(day.inspectedOn)}`}
              {!day.inspectionScheduled && day.supervisors.length > 0 && " · unscheduled visit"}
            </span>
          </header>
          <PeopleList people={day.supervisors} tz={tz} date={day.date} empty="No supervisor scheduled." onOpen={onOpenSupervisor} />
        </section>
      )}
    </div>
  );
}

function PeopleList({ people, tz, date, empty, onOpen, showShift }: {
  people: SiteDayPerson[];
  tz?: string | null;
  date: string;
  empty: string;
  onOpen?: (id: string) => void;
  showShift?: boolean;
}) {
  if (people.length === 0) {
    return <p className="px-3 pb-3 text-xs text-grey-500">{empty}</p>;
  }
  return (
    <ul className="divide-y divide-grey-100">
      {people.map((p) => {
        const meta = PERSON_STATUS_META[p.status];
        return (
          <li key={p.id} className="flex flex-col gap-1.5 px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                {onOpen ? (
                  <button
                    type="button"
                    onClick={() => onOpen(p.id)}
                    className="truncate text-sm font-medium text-on-surface underline-offset-2 hover:text-primary hover:underline"
                    title="Open schedule"
                  >
                    {p.name}
                  </button>
                ) : (
                  <span className="truncate text-sm font-medium text-on-surface">{p.name}</span>
                )}
                {!p.expected && (
                  <span className="shrink-0 rounded-full bg-grey-100 px-1.5 py-0.5 text-[10px] font-medium text-grey-500">
                    {showShift ? "Not assigned" : "Unscheduled"}
                  </span>
                )}
              </span>
              <span className="flex flex-wrap items-center gap-1">
                {p.forgotCheckout && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                    <AlarmClockOff size={11} aria-hidden="true" /> Forgot check-out
                  </span>
                )}
                {p.forcedCheckout && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                    <CircleAlert size={11} aria-hidden="true" /> Forced check-out
                  </span>
                )}
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", meta.cls)}>
                  {p.status === "IN_PROGRESS" && <LiveDot />}
                  {meta.label}
                </span>
              </span>
            </div>
            {showShift && p.shiftStart && (
              <p className="flex items-center gap-1 text-xs text-grey-600">
                <Clock size={12} aria-hidden="true" />
                Shift {formatWindow(p.shiftStart, p.shiftEnd)}
                {p.moveMinutes !== 0 && p.originalShiftStart && (
                  <span className="ml-1 rounded bg-amber-50 px-1 text-[10px] font-medium text-amber-700">
                    moved from {formatLocalTime(p.originalShiftStart)}
                  </span>
                )}
              </p>
            )}
            {p.sessions.map((s, i) => (
              <SessionRow key={s.id ?? i} session={s} tz={tz} date={date} />
            ))}
          </li>
        );
      })}
    </ul>
  );
}

function SessionRow({ session: s, tz, date }: { session: SiteDaySession; tz?: string | null; date: string }) {
  const reason = s.closeReason ? CLOSE_REASON_LABEL[s.closeReason] ?? s.closeReason : null;
  const forgot = s.closeReason === "FORGOT_CHECKOUT";
  const forced = s.status === "FORCED_CHECKOUT";
  return (
    <div className="rounded-lg bg-grey-50 px-2.5 py-2 text-xs text-grey-700">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {s.poId && <span className="rounded bg-[#F97316]/10 px-1.5 font-semibold text-[#C2410C]">PO {s.poId}</span>}
        <span className="inline-flex items-center gap-1">
          <LogIn size={12} className="text-emerald-600" aria-hidden="true" /> In {formatInstantOn(s.checkInAt, tz, date) || "—"}
          {s.lateMinutes != null && s.lateMinutes > 0 && (
            <span className="text-amber-700">({formatMinutes(s.lateMinutes)} late)</span>
          )}
        </span>
        <span className="inline-flex items-center gap-1">
          <LogOut size={12} className={forgot ? "text-red-600" : "text-grey-500"} aria-hidden="true" /> Out{" "}
          {s.checkOutAt ? formatInstantOn(s.checkOutAt, tz, date) : <span className="font-medium text-amber-700">on site</span>}
        </span>
        {s.status === "PAUSED" && s.pausedAt && (
          <span className="inline-flex items-center gap-1 font-medium text-orange-700">
            <PauseCircle size={12} aria-hidden="true" /> Paused since {formatInstantOn(s.pausedAt, tz, date)}
          </span>
        )}
        {s.workedMinutes != null && <span>Worked {formatMinutes(s.workedMinutes)}</span>}
        {s.pausedMinutes > 0 && <span>Paused {formatMinutes(s.pausedMinutes)}</span>}
      </div>
      {s.pauses.length > 0 && (
        <ul className="mt-1 flex flex-col gap-0.5 text-[11px] text-grey-500">
          {s.pauses.map((p, i) => (
            <li key={i} className="flex items-center gap-1">
              <PauseCircle size={11} aria-hidden="true" />
              Paused {formatInstantOn(p.pausedAt, tz, date)}
              {p.resumedAt ? ` → resumed ${formatInstantOn(p.resumedAt, tz, date)}` : " · still paused"}
              {p.reason && ` · ${PAUSE_REASON_LABEL[p.reason] ?? p.reason}`}
            </li>
          ))}
        </ul>
      )}
      {reason && s.closeReason !== "CHECKED_OUT" && (
        <p className={cn("mt-1 text-[11px] font-medium", forgot || forced ? "text-red-700" : "text-grey-600")}>
          {reason}
          {s.checkedOutBy === "OTHER" && " · closed by someone else"}
        </p>
      )}
      {s.checkoutNote && <p className="mt-1 text-[11px] italic text-grey-600">“{s.checkoutNote}”</p>}
    </div>
  );
}

export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex h-2 w-2", className)} aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
    </span>
  );
}

/** Inline key for workflow status colours. */
export function DayStatusLegend({ statuses }: { statuses: DayStatusKey[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {statuses.map((s) => {
        const meta = SITE_DAY_STATUS_META[s];
        return (
          <span
            key={s}
            title={meta.description}
            className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", meta.cls)}
          >
            {meta.live && <LiveDot />}
            {meta.label}
          </span>
        );
      })}
    </div>
  );
}
