"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Nfc, Check, AlertTriangle, LocateFixed, X } from "lucide-react";
import { SlideButton } from "@/components/shared/SlideButton";
import { SiteSelector } from "@/components/shared/SiteSelector";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { getCurrentPosition } from "@/lib/geolocation";
import { isNfcSupported, readNfcTag } from "@/lib/nfc";
import { useCheckIn, useCheckOut } from "@/features/attendance/hooks/useAttendance";
import { useMyTasks } from "@/features/tasks/hooks/useTasks";
import { toLocalDateString } from "@/features/tasks/lib/task-utils";
import type { TaskOccurrence } from "@/features/tasks/schemas/task.schema";
import type { CheckInPayload, CleanerSite } from "@/features/attendance/schemas/attendance.schema";

function formatTime(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function getMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "response" in error) {
    const data = (error as { response?: { data?: { message?: string } } }).response?.data;
    if (data?.message) return data.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

// Resolve how the cleaner proves presence: prefer the site's NFC tag on capable
// devices, otherwise (or on scan failure) fall back to geolocation.
async function acquirePayload(site: CleanerSite): Promise<CheckInPayload> {
  if (site.nfcRegistered && isNfcSupported()) {
    try {
      const uid = await readNfcTag();
      return { siteId: site.siteId, method: "NFC", nfcTagId: uid };
    } catch (err) {
      // No location fallback available — surface the NFC error as-is.
      if (!site.hasCoordinates) throw err;
    }
  }
  if (!site.hasCoordinates) {
    throw new Error("This site has no NFC tag or map location set up. Please contact your supervisor.");
  }
  const pos = await getCurrentPosition();
  return {
    siteId: site.siteId,
    method: "GEO",
    latitude: pos.lat,
    longitude: pos.lng,
    accuracyMeters: pos.accuracy,
  };
}

interface CheckInPanelProps {
  sites: CleanerSite[];
  isLoading: boolean;
}

export function CheckInPanel({ sites, isLoading }: CheckInPanelProps) {
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const today = toLocalDateString(new Date());
  const { data: todayTasks = [] } = useMyTasks(today);

  // Per-site error message and a remount key to reset the slider after a failure.
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resetKeys, setResetKeys] = useState<Record<string, number>>({});
  // Pending-task consent prompt shown before checking out with unfinished work.
  const [pendingPrompt, setPendingPrompt] = useState<
    { site: CleanerSite; tasks: TaskOccurrence[] } | null
  >(null);
  const [confirming, setConfirming] = useState(false);

  const checkedInSiteId = sites.find((s) => s.status === "CHECKED_IN")?.siteId ?? null;

  // Only offer sites with tasks scheduled today — plus whichever site the cleaner is
  // already checked into, so they're never blocked from checking out just because
  // today's tasks there are all done.
  const sitesWithTasksToday = useMemo(
    () => new Set(todayTasks.map((t) => t.siteId)),
    [todayTasks],
  );
  const visibleSites = useMemo(
    () => sites.filter((s) => sitesWithTasksToday.has(s.siteId) || s.siteId === checkedInSiteId),
    [sites, sitesWithTasksToday, checkedInSiteId],
  );

  // Which of the cleaner's visible sites this single card/slider acts on. Defaults to
  // the checked-in site, but the cleaner can switch via the selector when they have more
  // than one.
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [siteTouched, setSiteTouched] = useState(false);

  useEffect(() => {
    if (siteTouched) return;
    setSelectedSiteId(checkedInSiteId ?? visibleSites[0]?.siteId ?? null);
  }, [checkedInSiteId, visibleSites, siteTouched]);

  function bumpReset(siteId: string) {
    setResetKeys((prev) => ({ ...prev, [siteId]: (prev[siteId] ?? 0) + 1 }));
  }

  function pendingTasksFor(siteId: string): TaskOccurrence[] {
    return todayTasks.filter(
      (t) => t.siteId === siteId && t.status !== "COMPLETED" && t.status !== "CANCELLED",
    );
  }

  // Redo/complaint tasks the cleaner must clear this shift at the given site.
  function redoTasksFor(siteId: string): TaskOccurrence[] {
    return pendingTasksFor(siteId).filter((t) => t.isRedo);
  }

  async function executeCheckout(site: CleanerSite, acknowledgeIncomplete: boolean) {
    setErrors((prev) => ({ ...prev, [site.siteId]: "" }));
    const payload = await acquirePayload(site);
    await checkOut.mutateAsync({ ...payload, acknowledgeIncomplete });
  }

  async function run(site: CleanerSite, mode: "in" | "out") {
    setErrors((prev) => ({ ...prev, [site.siteId]: "" }));
    try {
      if (mode === "in") {
        const payload = await acquirePayload(site);
        await checkIn.mutateAsync(payload);
        return;
      }
      // Check-out: block on any unfinished tasks and ask for consent first.
      const pending = pendingTasksFor(site.siteId);
      if (pending.length > 0) {
        setPendingPrompt({ site, tasks: pending });
        bumpReset(site.siteId);
        return;
      }
      await executeCheckout(site, false);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [site.siteId]: getMessage(err, mode === "in" ? "Check-in failed." : "Check-out failed."),
      }));
      bumpReset(site.siteId);
    }
  }

  async function confirmPendingCheckout() {
    if (!pendingPrompt) return;
    const { site } = pendingPrompt;
    setConfirming(true);
    try {
      await executeCheckout(site, true);
      setPendingPrompt(null);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [site.siteId]: getMessage(err, "Check-out failed."),
      }));
      setPendingPrompt(null);
      bumpReset(site.siteId);
    } finally {
      setConfirming(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <p className="rounded-2xl bg-white/50 px-4 py-6 text-center text-sm text-grey-500">
        You have no sites assigned yet. Please contact your supervisor.
      </p>
    );
  }

  if (visibleSites.length === 0) {
    return (
      <p className="rounded-2xl bg-white/50 px-4 py-6 text-center text-sm text-grey-500">
        No tasks scheduled for you today — nothing to check in for.
      </p>
    );
  }

  const site = visibleSites.find((s) => s.siteId === selectedSiteId) ?? visibleSites[0];
  const error = errors[site.siteId];
  const resetKey = resetKeys[site.siteId] ?? 0;
  const checkedIn = site.status === "CHECKED_IN";
  const checkedOut = site.status === "CHECKED_OUT";
  const redoTasks = checkedOut ? [] : redoTasksFor(site.siteId);

  return (
    <div className="flex flex-col gap-3">
      <div key={site.siteId} className="flex flex-col gap-2.5 rounded-2xl bg-white/70 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {visibleSites.length > 1 ? (
              <SiteSelector
                sites={visibleSites}
                selectedSiteId={selectedSiteId}
                onChange={(siteId) => {
                  setSiteTouched(true);
                  setSelectedSiteId(siteId);
                }}
                checkedInSiteId={checkedInSiteId}
                className="!bg-transparent !px-0 !py-0 !shadow-none"
              />
            ) : (
              <>
                <p className="truncate text-sm font-semibold text-on-surface">{site.siteName}</p>
                {site.streetAddress && (
                  <p className="truncate text-xs text-grey-500">{site.streetAddress}</p>
                )}
              </>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {site.nfcRegistered && (
              <span
                title="NFC check-in available"
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
              >
                <Nfc size={12} /> NFC
              </span>
            )}
            {site.hasCoordinates && (
              <span
                title="Location check-in available"
                className="inline-flex items-center gap-1 rounded-full bg-grey-100 px-2 py-0.5 text-[11px] font-medium text-grey-700"
              >
                <MapPin size={12} /> Location
              </span>
            )}
          </div>
        </div>

        {redoTasks.length > 0 && (
          <div className="rounded-xl border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED]">
              <AlertTriangle size={14} className="shrink-0" aria-hidden="true" />
              {redoTasks.length} redo/complaint task{redoTasks.length > 1 ? "s" : ""} to
              complete this shift
            </p>
            <ul className="mt-1 list-disc pl-5 text-xs text-grey-700">
              {redoTasks.slice(0, 4).map((t) => (
                <li key={t.redoId ?? t.taskId}>
                  {t.name}
                  {t.areaName ? ` · ${t.areaName}` : ""}
                </li>
              ))}
              {redoTasks.length > 4 && <li>and {redoTasks.length - 4} more…</li>}
            </ul>
            <p className="mt-1 text-[11px] text-grey-500">
              You must finish these before you can check out.
            </p>
          </div>
        )}

        {checkedOut ? (
          <div className="flex items-center justify-center gap-2 rounded-full bg-success/10 px-4 py-3 text-sm font-semibold text-success">
            <Check size={16} aria-hidden="true" /> Shift complete
          </div>
        ) : checkedIn ? (
          <SlideButton
            key={`out-${resetKey}`}
            label="Slide to Check Out"
            variant="checkout"
            completedLabel="Checking out…"
            onComplete={() => run(site, "out")}
          />
        ) : (
          <SlideButton
            key={`in-${resetKey}`}
            label="Slide to Check In"
            variant="teal"
            completedLabel="Checking in…"
            onComplete={() => run(site, "in")}
          />
        )}

        {(checkedIn || checkedOut) && (
          <p className="flex items-center justify-center gap-1 text-center text-xs text-grey-500">
            <LocateFixed size={12} />
            Checked in at {formatTime(site.checkInAt)}
            {site.checkOutAt ? ` · Checked out at ${formatTime(site.checkOutAt)}` : ""}
          </p>
        )}

        {error && (
          <p className="flex items-start gap-1.5 rounded-lg bg-error/10 px-3 py-2 text-xs font-medium text-error">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>

      {pendingPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pending-tasks-title"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !confirming && setPendingPrompt(null)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl bg-surface shadow-2xl">
            <div className="flex items-start justify-between gap-3 px-5 pt-5">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-error/10 text-error">
                  <AlertTriangle size={18} aria-hidden="true" />
                </span>
                <h2 id="pending-tasks-title" className="text-base font-semibold text-on-surface">
                  Incomplete tasks
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close"
                disabled={confirming}
                onClick={() => setPendingPrompt(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-grey-100 disabled:opacity-50"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="px-5 pt-3">
              <p className="text-sm text-grey-700">
                You still have {pendingPrompt.tasks.length} unfinished task
                {pendingPrompt.tasks.length === 1 ? "" : "s"} at{" "}
                <span className="font-medium text-on-surface">{pendingPrompt.site.siteName}</span>.
                If you check out now, your supervisor will be notified.
              </p>

              <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto rounded-2xl bg-white/70 p-3">
                {pendingPrompt.tasks.map((t) => (
                  <li key={`${t.taskId}-${t.occurrenceDate}`} className="text-sm">
                    <p className="font-medium text-on-surface">{t.name}</p>
                    <p className="text-xs text-grey-500">
                      {t.floorName} · {t.areaName}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3 px-5 pb-5 pt-4">
              <button
                type="button"
                disabled={confirming}
                onClick={() => setPendingPrompt(null)}
                className="flex-1 rounded-xl border border-grey-300 px-4 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100 disabled:opacity-50"
              >
                Keep working
              </button>
              <button
                type="button"
                disabled={confirming}
                onClick={confirmPendingCheckout}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-error px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-error/90 disabled:opacity-60"
              >
                {confirming ? "Checking out…" : "Check out anyway"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}