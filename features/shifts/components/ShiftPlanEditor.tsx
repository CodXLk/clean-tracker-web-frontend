"use client";

import { Clock, MapPin, MoonStar, Plus, Trash2 } from "lucide-react";
import { TimeField } from "@/components/shared/TimeField";
import { DAY_OF_WEEK_VALUES, type DayOfWeek } from "@/features/user-management/schemas/site.schema";
import {
  DAY_SHORT,
  type ShiftPlan,
  type ShiftPlanInput,
  type SiteShiftContext,
} from "@/features/shifts/schemas/shiftPlan.schema";
import { cn } from "@/lib/utils/cn";

type Day = ShiftPlanInput["days"][number];

function toMin(t: string): number {
  const [h, m] = t.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

function lengthMinutes(s: string, e: string): number {
  return (((toMin(e) - toMin(s)) % 1440) + 1440) % 1440;
}

function windowFor(ctx: SiteShiftContext, day: DayOfWeek) {
  return ctx.generalWindows.find((w) => w.dayOfWeek === day) ?? null;
}

function fitsWindow(ws: string, we: string, s: string, e: string): boolean {
  let wl = lengthMinutes(ws, we);
  if (wl === 0) wl = 1440;
  const off = (((toMin(s) - toMin(ws)) % 1440) + 1440) % 1440;
  return off + lengthMinutes(s, e) <= wl;
}

/** Working days the site runs (all days when none are configured). */
export function siteDays(ctx: SiteShiftContext): DayOfWeek[] {
  return ctx.workingDays.length > 0
    ? DAY_OF_WEEK_VALUES.filter((d) => ctx.workingDays.includes(d))
    : [...DAY_OF_WEEK_VALUES];
}

/** Starting point for the editor: pending > approved > the site's General window. */
export function initialPlan(ctx: SiteShiftContext, existing?: ShiftPlan | null): ShiftPlanInput {
  const source = existing ?? ctx.pendingPlan ?? ctx.approvedPlan;
  if (source && source.days.length > 0) {
    return {
      days: source.days.map((d) => ({
        dayOfWeek: d.dayOfWeek ?? null,
        startTime: d.startTime.slice(0, 5),
        endTime: d.endTime.slice(0, 5),
      })),
    };
  }
  const first = ctx.generalWindows[0];
  const sameEveryDay = ctx.generalWindows.every(
    (w) => w.startTime === first?.startTime && w.endTime === first?.endTime,
  );
  if (first && !sameEveryDay) {
    return {
      days: ctx.generalWindows.map((w) => ({
        dayOfWeek: w.dayOfWeek,
        startTime: w.startTime.slice(0, 5),
        endTime: w.endTime.slice(0, 5),
      })),
    };
  }
  return {
    days: [{ dayOfWeek: null, startTime: first?.startTime.slice(0, 5) ?? "07:00", endTime: first?.endTime.slice(0, 5) ?? "09:00" }],
  };
}

/** Problems the backend would reject, so the cleaner sees them before sending. */
export function planProblems(ctx: SiteShiftContext, plan: ShiftPlanInput): string[] {
  const problems: string[] = [];
  if (plan.days.length === 0) problems.push("Add at least one shift.");
  const days = siteDays(ctx);
  for (const d of plan.days) {
    const label = d.dayOfWeek ? DAY_SHORT[d.dayOfWeek] : "Every working day";
    if (!d.startTime || !d.endTime) {
      problems.push(`${label}: set a start and end time.`);
      continue;
    }
    if (d.startTime === d.endTime) problems.push(`${label}: start and end can't be the same.`);
    if (ctx.minimumWorkMinutes && lengthMinutes(d.startTime, d.endTime) < ctx.minimumWorkMinutes) {
      problems.push(`${label}: must be at least ${ctx.minimumWorkMinutes} minutes.`);
    }
    const check = d.dayOfWeek
      ? [d.dayOfWeek]
      : days.filter((day) => !plan.days.some((o) => o.dayOfWeek === day));
    for (const day of check) {
      const w = windowFor(ctx, day);
      if (w && !fitsWindow(w.startTime, w.endTime, d.startTime, d.endTime)) {
        problems.push(
          `${DAY_SHORT[day]}: must be within the General window ${w.startTime.slice(0, 5)}–${w.endTime.slice(0, 5)}.`,
        );
      }
    }
  }
  return problems;
}

/** Site facts a cleaner needs before proposing shifts. */
export function SiteShiftFacts({ ctx }: { ctx: SiteShiftContext }) {
  const days = siteDays(ctx);
  return (
    <div className="rounded-xl border border-grey-200 bg-grey-50 p-3 text-xs text-grey-600">
      <p className="text-sm font-semibold text-on-surface">{ctx.siteName}</p>
      {ctx.streetAddress && (
        <p className="mt-0.5 flex items-center gap-1">
          <MapPin size={12} aria-hidden /> {ctx.streetAddress}
        </p>
      )}
      <p className="mt-2">
        <span className="font-medium text-on-surface">Working days:</span>{" "}
        {days.map((d) => DAY_SHORT[d]).join(", ")}
      </p>
      <p className="mt-1">
        <span className="font-medium text-on-surface">General task time:</span>{" "}
        {ctx.generalWindows.length === 0
          ? "Not set (any time)"
          : ctx.generalWindows
              .map((w) => `${DAY_SHORT[w.dayOfWeek]} ${w.startTime.slice(0, 5)}–${w.endTime.slice(0, 5)}`)
              .join(" · ")}
      </p>
      {ctx.minimumWorkMinutes ? (
        <p className="mt-1">
          <span className="font-medium text-on-surface">Minimum working period:</span> {ctx.minimumWorkMinutes} min
        </p>
      ) : null}
      <p className="mt-1">
        <span className="font-medium text-on-surface">Time zone:</span> {ctx.timezone}
      </p>
    </div>
  );
}

/** Controlled editor: one shift for every working day, plus optional per-day overrides. */
export function ShiftPlanEditor({
  ctx,
  value,
  onChange,
}: {
  ctx: SiteShiftContext;
  value: ShiftPlanInput;
  onChange: (next: ShiftPlanInput) => void;
}) {
  const days = siteDays(ctx);
  const perDay = !value.days.some((d) => d.dayOfWeek === null);
  const usedDays = new Set(value.days.map((d) => d.dayOfWeek).filter(Boolean) as DayOfWeek[]);
  const freeDays = days.filter((d) => !usedDays.has(d));

  function update(index: number, patch: Partial<Day>) {
    onChange({ ...value, days: value.days.map((d, i) => (i === index ? { ...d, ...patch } : d)) });
  }

  function setMode(nextPerDay: boolean) {
    if (nextPerDay === perDay) return;
    const base = value.days[0] ?? { dayOfWeek: null, startTime: "07:00", endTime: "09:00" };
    onChange({
      ...value,
      days: nextPerDay
        ? days.map((d) => ({ dayOfWeek: d, startTime: base.startTime, endTime: base.endTime }))
        : [{ dayOfWeek: null, startTime: base.startTime, endTime: base.endTime }],
    });
  }

  const ordered = value.days
    .map((d, i) => ({ d, i }))
    .sort(
      (a, b) =>
        (a.d.dayOfWeek ? DAY_OF_WEEK_VALUES.indexOf(a.d.dayOfWeek) : -1) -
        (b.d.dayOfWeek ? DAY_OF_WEEK_VALUES.indexOf(b.d.dayOfWeek) : -1),
    );

  return (
    <div className="flex flex-col gap-3">
      <div className="inline-flex w-fit rounded-full border border-grey-200 p-0.5 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMode(false)}
          className={cn("rounded-full px-3 py-1.5", !perDay ? "bg-primary text-on-primary" : "text-grey-500")}
        >
          Same shift every working day
        </button>
        <button
          type="button"
          onClick={() => setMode(true)}
          className={cn("rounded-full px-3 py-1.5", perDay ? "bg-primary text-on-primary" : "text-grey-500")}
        >
          Different shift per day
        </button>
      </div>

      {ordered.map(({ d, i }) => {
        const overnight = d.startTime && d.endTime && toMin(d.endTime) <= toMin(d.startTime);
        return (
          <div key={`${d.dayOfWeek ?? "all"}-${i}`} className="rounded-2xl border border-grey-200 bg-grey-100/40 p-3">
            <div className="flex items-end gap-2">
              <span className="mb-3 w-28 shrink-0 text-sm font-medium text-on-surface">
                {d.dayOfWeek ? DAY_SHORT[d.dayOfWeek] : perDay ? "" : "Every working day"}
              </span>
              <div className="flex-1">
                <TimeField label="Start" value={d.startTime} onChange={(v) => update(i, { startTime: v })} />
              </div>
              <div className="flex-1">
                <TimeField label="End" value={d.endTime} onChange={(v) => update(i, { endTime: v })} />
              </div>
              {d.dayOfWeek && value.days.length > 1 && (
                <button
                  type="button"
                  onClick={() => onChange({ ...value, days: value.days.filter((_, j) => j !== i) })}
                  className="mb-2 rounded-full p-2 text-grey-500 hover:bg-grey-100 hover:text-danger"
                  aria-label="Remove day"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            {d.startTime && d.endTime && (
              <div className="mt-2 flex items-center gap-2 text-xs text-grey-500">
                <Clock size={12} aria-hidden />
                {Math.floor(lengthMinutes(d.startTime, d.endTime) / 60)}h {lengthMinutes(d.startTime, d.endTime) % 60}m
                {overnight && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-600">
                    <MoonStar size={12} aria-hidden /> Ends next day
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}

      {perDay && freeDays.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-grey-500">Add a day:</span>
          {freeDays.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() =>
                onChange({
                  ...value,
                  days: [...value.days, { dayOfWeek: d, startTime: value.days[0]?.startTime ?? "07:00", endTime: value.days[0]?.endTime ?? "09:00" }],
                })
              }
              className="inline-flex items-center gap-1 rounded-full border border-grey-300 px-2.5 py-1 font-medium text-on-surface hover:bg-grey-50"
            >
              <Plus size={12} /> {DAY_SHORT[d]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
