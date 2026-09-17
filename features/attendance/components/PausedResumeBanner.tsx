"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { SlideButton } from "@/components/shared/SlideButton";
import { useCheckIn } from "@/features/attendance/hooks/useAttendance";
import { acquireCheckInPayload } from "@/features/attendance/lib/acquireCheckInPayload";
import type { CleanerSite } from "@/features/attendance/schemas/attendance.schema";

function messageFrom(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "response" in error) {
    const data = (error as { response?: { data?: { message?: string } } }).response?.data;
    if (data?.message) return data.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

/**
 * Shown on the Tasks pages when the cleaner's shift is paused: their tasks are view-only until
 * they slide to start (resume) the same session.
 */
export function PausedResumeBanner({ site }: { site: CleanerSite }) {
  const checkIn = useCheckIn();
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  async function resume() {
    setError(null);
    try {
      const payload = await acquireCheckInPayload(site);
      await checkIn.mutateAsync(payload);
    } catch (e) {
      setError(messageFrom(e, "Couldn't resume — please try again."));
      setResetKey((k) => k + 1);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#ED5F25]/30 bg-[#ED5F25]/[0.08] px-4 py-4">
      <div>
        <p className="flex items-center gap-1.5 text-sm font-semibold text-[#ED5F25]">
          <AlertTriangle size={16} aria-hidden="true" /> Shift paused at {site.siteName}
        </p>
        <p className="mt-1 text-sm text-grey-600">
          {site.awayDistanceMeters
            ? `You moved about ${Math.round(site.awayDistanceMeters)} m away. `
            : "Your location was lost or the app was closed. "}
          Your tasks are view-only — slide to start to resume and complete them.
        </p>
      </div>
      <SlideButton
        key={resetKey}
        label="Slide to start to resume"
        variant="teal"
        completedLabel="Resuming…"
        onComplete={resume}
      />
      {error && (
        <p className="flex items-start gap-1.5 rounded-lg bg-error/10 px-3 py-2 text-xs font-medium text-error">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
