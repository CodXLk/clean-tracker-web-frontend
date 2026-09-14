"use client";

import { certificateAbbreviation, isMandatoryCertificate } from "@/features/users/schemas/document.schema";
import { cn } from "@/lib/utils/cn";

export type CertBadgeTone = "held" | "missing" | "neutral";

export interface CertBadge {
  /** Short text shown in the pill (e.g. "WWCC"). */
  text: string;
  /** Full description shown on hover. */
  title: string;
  tone: CertBadgeTone;
}

const TONE_CLASSES: Record<CertBadgeTone, string> = {
  held: "border-success/30 bg-success/10 text-success",
  missing: "border-error/30 bg-error/10 text-error",
  neutral: "border-grey-200 bg-grey-100 text-grey-600",
};

/** A compact certificate pill; the full name appears on hover via the native title tooltip. */
export function CertificateBadge({ badge, className }: { badge: CertBadge; className?: string }) {
  return (
    <span
      title={badge.title}
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold leading-none",
        TONE_CLASSES[badge.tone],
        className,
      )}
    >
      {badge.text}
    </span>
  );
}

/** A wrapping row of certificate badges. */
export function CertificateBadgeRow({ badges, className }: { badges: CertBadge[]; className?: string }) {
  if (badges.length === 0) return null;
  return (
    <span className={cn("flex flex-wrap items-center gap-1", className)}>
      {badges.map((b, i) => (
        <CertificateBadge key={`${b.text}-${i}`} badge={b} />
      ))}
    </span>
  );
}

/** True when the candidate holds every required certificate. */
export function holdsAllRequired(requiredKeys: string[], heldKeys: string[]): boolean {
  const held = new Set(heldKeys);
  return requiredKeys.every((k) => held.has(k));
}

/**
 * Badges + view-only (disabled) metadata for a candidate in an assignment dropdown.
 * Badges show only the non-mandatory certificates the candidate actually holds; missing
 * required certificates are surfaced through {@link disabledReason} rather than as badges.
 */
export function candidateCertMeta(
  requiredKeys: string[],
  heldKeys: string[],
  labelFor: (key: string) => string,
): { badges: CertBadge[]; disabled: boolean; disabledReason?: string } {
  const held = new Set(heldKeys);
  const badges: CertBadge[] = heldKeys
    .filter((k) => !isMandatoryCertificate(k))
    .map((k) => ({
      text: certificateAbbreviation(k, labelFor(k)),
      title: labelFor(k),
      tone: "held" as const,
    }));
  const missing = requiredKeys.filter((k) => !held.has(k));
  return {
    badges,
    disabled: missing.length > 0,
    disabledReason: missing.length > 0 ? `Missing: ${missing.map(labelFor).join(", ")}` : undefined,
  };
}
