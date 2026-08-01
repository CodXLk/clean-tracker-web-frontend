"use client";

import { useState } from "react";
import { MapPin, Nfc, Check, AlertTriangle, LocateFixed } from "lucide-react";
import { SlideButton } from "@/components/shared/SlideButton";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { getCurrentPosition } from "@/lib/geolocation";
import { isNfcSupported, readNfcTag } from "@/lib/nfc";
import { useCheckIn, useCheckOut } from "@/features/attendance/hooks/useAttendance";
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

  // Per-site error message and a remount key to reset the slider after a failure.
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resetKeys, setResetKeys] = useState<Record<string, number>>({});

  function bumpReset(siteId: string) {
    setResetKeys((prev) => ({ ...prev, [siteId]: (prev[siteId] ?? 0) + 1 }));
  }

  async function run(site: CleanerSite, mode: "in" | "out") {
    setErrors((prev) => ({ ...prev, [site.siteId]: "" }));
    try {
      const payload = await acquirePayload(site);
      if (mode === "in") await checkIn.mutateAsync(payload);
      else await checkOut.mutateAsync(payload);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [site.siteId]: getMessage(err, mode === "in" ? "Check-in failed." : "Check-out failed."),
      }));
      bumpReset(site.siteId);
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

  return (
    <div className="flex flex-col gap-3">
      {sites.map((site) => {
        const error = errors[site.siteId];
        const resetKey = resetKeys[site.siteId] ?? 0;
        const checkedIn = site.status === "CHECKED_IN";
        const checkedOut = site.status === "CHECKED_OUT";

        return (
          <div key={site.siteId} className="flex flex-col gap-2.5 rounded-2xl bg-white/70 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-on-surface">{site.siteName}</p>
                {site.streetAddress && (
                  <p className="truncate text-xs text-grey-500">{site.streetAddress}</p>
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
        );
      })}
    </div>
  );
}
