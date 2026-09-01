import Link from "next/link";
import { MapPin } from "lucide-react";

interface CheckInRequiredBannerProps {
  /** Tailors the copy to the page. */
  action?: "complete" | "inspect";
}

/** Shown on the Tasks/Inspections pages until the cleaner/supervisor checks in to a site. */
export function CheckInRequiredBanner({ action = "complete" }: CheckInRequiredBannerProps) {
  const verb = action === "inspect" ? "view and inspect" : "view and complete";
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-primary/20 bg-primary/[0.06] px-5 py-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-ink">
        <MapPin size={24} aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold text-on-surface">Check in to view your tasks</p>
        <p className="mt-1 text-sm text-grey-600">
          Check in to a site to {verb} its tasks. Until you check in, no areas, floors or tasks are shown.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Go to check-in
      </Link>
    </div>
  );
}
