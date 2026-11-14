"use client";

import { useState } from "react";
import { CalendarDays, Loader2, Minus, Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { formatMove, useMoveShift, useMyShiftSchedule, type ShiftDay } from "@/features/shifts/hooks/useShiftSchedule";
import { toLocalDateString } from "@/features/tasks/lib/task-utils";
import { cn } from "@/lib/utils/cn";

/** Moves go up to 3 hours either way in 30-minute steps (later = positive). */
const MOVE_STEP = 30;
const MOVE_LIMIT = 180;

function siteTime(iso: string, tz: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", timeZone: tz });
}

/** The shift's start/end if moved by `minutes` from its original time. */
function previewTimes(d: ShiftDay, minutes: number) {
  const shift = (minutes - d.moveMinutes) * 60_000;
  return {
    start: siteTime(new Date(new Date(d.startAt).getTime() + shift).toISOString(), d.timezone),
    end: siteTime(new Date(new Date(d.endAt).getTime() + shift).toISOString(), d.timezone),
  };
}

function moveLabel(minutes: number) {
  return minutes === 0 ? "Original time" : `${formatMove(Math.abs(minutes))} ${minutes > 0 ? "later" : "earlier"}`;
}

function StepButton({
  icon: Icon,
  label,
  disabled,
  onClick,
}: {
  icon: typeof Plus;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        aria-label={`${label} 30 minutes`}
        disabled={disabled}
        onClick={onClick}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-grey-300 bg-white text-on-surface transition-colors hover:bg-grey-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Icon size={18} aria-hidden />
      </button>
      <span className="text-[11px] text-grey-500">{label}</span>
    </div>
  );
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
  const [openKey, setOpenKey] = useState<string | null>(
    focusSite && focusDate ? `${focusSite}-${focusDate}` : null,
  );
  const [draft, setDraft] = useState<number | null>(null);

  function toggle(key: string) {
    setDraft(null);
    setOpenKey(openKey === key ? null : key);
  }

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
      setOpenKey(null);
      setDraft(null);
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
            const current = d.pendingMoveMinutes ?? d.moveMinutes;
            const open = openKey === key && d.canMove;
            const value = draft ?? current;
            const preview = previewTimes(d, value);
            const unchanged = value === current;
            return (
              <li
                key={key}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border px-4 py-3",
                  focused ? "border-primary bg-primary/5" : "border-grey-200",
                )}
              >
                <div className="flex items-start justify-between gap-3">
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
                  <button
                    type="button"
                    onClick={() => toggle(key)}
                    aria-expanded={open}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold text-on-surface transition-colors",
                      open ? "border-primary bg-primary/10" : "border-grey-300 hover:bg-grey-100",
                    )}
                  >
                    {open ? "Close" : "Move"}
                  </button>
                )}
                </div>
                {open && (
                  <div className="flex flex-col gap-3 rounded-xl bg-grey-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <StepButton
                        icon={Minus}
                        label="Earlier"
                        disabled={move.isPending || value <= -MOVE_LIMIT}
                        onClick={() => setDraft(Math.max(-MOVE_LIMIT, value - MOVE_STEP))}
                      />
                      <div className="flex min-w-0 flex-1 flex-col items-center text-center">
                        <span
                          className={cn(
                            "text-base font-semibold",
                            value === 0 ? "text-on-surface" : value > 0 ? "text-amber-700" : "text-teal-700",
                          )}
                        >
                          {moveLabel(value)}
                        </span>
                        <span className="text-xs text-grey-600">
                          {preview.start}–{preview.end}
                        </span>
                      </div>
                      <StepButton
                        icon={Plus}
                        label="Later"
                        disabled={move.isPending || value >= MOVE_LIMIT}
                        onClick={() => setDraft(Math.min(MOVE_LIMIT, value + MOVE_STEP))}
                      />
                    </div>
                    {d.moveNeedsApproval && (
                      <p className="text-center text-xs text-amber-700">
                        More than 24 hours ahead, so this move needs approval.
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={unchanged || move.isPending}
                      onClick={() => apply(d, value)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {move.isPending && <Loader2 size={16} className="animate-spin" aria-hidden />}
                      {value === 0 ? "Reset to original time" : `Set ${moveLabel(value)}`}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
