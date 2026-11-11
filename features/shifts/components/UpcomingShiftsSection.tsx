"use client";

import { useState } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { formatMove, useMoveShift, useMyShiftSchedule, type ShiftDay } from "@/features/shifts/hooks/useShiftSchedule";
import { toLocalDateString } from "@/features/tasks/lib/task-utils";
import { cn } from "@/lib/utils/cn";

/** Move options: up to 3 hours either way in 30-minute steps (later = positive). */
const MOVE_OPTIONS = [-180, -120, -90, -60, -30, 0, 30, 60, 90, 120, 180];

function siteTime(iso: string, tz: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", timeZone: tz });
}

/** Upcoming shifts (next 7 days) with one-day moves ("snooze") — later or earlier by up to 3 hours. */
export function UpcomingShiftsSection() {
  const params = useSearchParams();
  const focusSite = params.get("siteId");
  const focusDate = params.get("date");
  const [{ from, to }] = useState(() => {
    const now = new Date();
    return {
      from: toLocalDateString(now),
      to: toLocalDateString(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)),
    };
  });
  const { data: days = [], isLoading } = useMyShiftSchedule(from, to);
  const move = useMoveShift();
  const [error, setError] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  async function apply(day: ShiftDay, minutes: number) {
    setError(null);
    try {
      await move.mutateAsync({
        siteId: day.siteId,
        date: day.date,
        moveMinutes: minutes,
        source: focusSite === day.siteId && focusDate === day.date ? "REMINDER" : "MANUAL",
      });
      setSavedKey(`${day.siteId}-${day.date}`);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  return (
    <section className="rounded-2xl bg-surface p-5 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <CalendarDays size={18} className="text-ink" aria-hidden />
        <h2 className="text-sm font-semibold text-on-surface">Upcoming shifts</h2>
      </div>
      <p className="mb-4 text-xs text-grey-500">
        Running late or early? Move one day&apos;s shift by up to 3 hours. Within 24 hours of the shift it applies
        straight away; further ahead it needs approval.
      </p>
      {error && <p className="mb-3 text-sm text-danger">{error}</p>}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin text-grey-400" />
        </div>
      ) : days.length === 0 ? (
        <p className="text-sm text-grey-500">No approved shifts in the next 7 days.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {days.map((d) => {
            const key = `${d.siteId}-${d.date}`;
            const focused = focusSite === d.siteId && focusDate === d.date;
            return (
              <li
                key={key}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3",
                  focused ? "border-primary bg-primary/5" : "border-grey-200",
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-on-surface">
                    {new Date(`${d.date}T00:00:00`).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })}{" "}
                    · {d.siteName}
                  </p>
                  <p className="text-xs text-grey-600">
                    {siteTime(d.startAt, d.timezone)}–{siteTime(d.endAt, d.timezone)}
                    {d.moveMinutes !== 0 && ` (moved ${formatMove(d.moveMinutes)} from ${d.originalStart.slice(0, 5)})`}
                  </p>
                  {d.pendingMoveMinutes != null && (
                    <p className="text-xs text-amber-700">Move {formatMove(d.pendingMoveMinutes)} awaiting approval</p>
                  )}
                  {savedKey === key && <p className="text-xs text-success">Saved.</p>}
                </div>
                {d.canMove && (
                  <label className="flex items-center gap-2 text-xs text-grey-600">
                    Move
                    <select
                      disabled={move.isPending}
                      value={d.pendingMoveMinutes ?? d.moveMinutes}
                      onChange={(e) => apply(d, Number(e.target.value))}
                      className="rounded-lg border border-grey-300 bg-white px-2 py-1.5 text-sm"
                    >
                      {MOVE_OPTIONS.map((m) => (
                        <option key={m} value={m}>
                          {m === 0 ? "No change" : `${formatMove(m)} ${m > 0 ? "later" : "earlier"}`}
                        </option>
                      ))}
                    </select>
                    {d.moveNeedsApproval && <span className="text-amber-700">needs approval</span>}
                  </label>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
