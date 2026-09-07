"use client";

import {
  Building2,
  CalendarDays,
  Clock,
  ExternalLink,
  MapPin,
  Nfc,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { PanelOrModal } from "@/components/shared/PanelOrModal";
import { WorkingDaysSelector } from "./WorkingDaysSelector";
import {
  SITE_TYPE_LABELS,
  type DayOfWeek,
  type Site,
} from "@/features/user-management/schemas/site.schema";
import { CERTIFICATE_TYPE_LABELS } from "@/features/users/schemas/document.schema";

interface SiteDetailViewProps {
  open: boolean;
  onClose: () => void;
  site: Site;
}

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

function hhmm(value?: string | null): string {
  return value ? value.slice(0, 5) : "";
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-grey-500">{label}</dt>
      <dd className="text-sm text-on-surface">{children ?? "—"}</dd>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-grey-200 bg-surface p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-ink">
          <Icon size={16} />
        </span>
        <h3 className="text-sm font-semibold text-on-surface">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export function SiteDetailView({ open, onClose, site }: SiteDetailViewProps) {
  const generalWindow =
    site.generalTaskTimeMode === "PER_DAY"
      ? site.generalTaskDayTimes ?? []
      : site.generalTaskStartTime || site.generalTaskEndTime
        ? [{ dayOfWeek: null, startTime: site.generalTaskStartTime, endTime: site.generalTaskEndTime }]
        : [];

  return (
    <PanelOrModal
      embedded
      open={open}
      onClose={onClose}
      title={site.name}
      description={`${SITE_TYPE_LABELS[site.siteType]} · ${site.clientCompanyName}`}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section icon={Building2} title="Overview">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Site type">{SITE_TYPE_LABELS[site.siteType]}</Field>
            <Field label="Cleaners required">{site.numberOfCleaners}</Field>
            <Field label="Client-company">{site.clientCompanyName}</Field>
            <Field label="Client">{site.clientName}</Field>
            <Field label="Client-managed">{site.clientSiteManagementEnabled ? "Enabled" : "Disabled"}</Field>
            <Field label="Public holidays">{site.worksOnPublicHolidays ? "Works" : "Closed"}</Field>
          </dl>
        </Section>

        <Section icon={User} title="Contact">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Contact person">{site.contactPersonName || "—"}</Field>
            <Field label="Contact number">{site.contactNumber || "—"}</Field>
          </dl>
        </Section>

        <Section icon={MapPin} title="Location">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Street address">{site.streetAddress || "—"}</Field>
            </div>
            <Field label="Coordinates">
              {site.latitude != null && site.longitude != null
                ? `${site.latitude.toFixed(5)}, ${site.longitude.toFixed(5)}`
                : "—"}
            </Field>
            <Field label="Geofence radius">
              {site.geofenceRadiusMeters != null ? `${site.geofenceRadiusMeters} m` : "—"}
            </Field>
            <div className="sm:col-span-2">
              <Field label="Google Maps">
                {site.googleMapsLink ? (
                  <a
                    href={site.googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-ink hover:underline"
                  >
                    Open in Maps <ExternalLink size={13} aria-hidden="true" />
                  </a>
                ) : (
                  "—"
                )}
              </Field>
            </div>
          </dl>
        </Section>

        <Section icon={Nfc} title="NFC check-in">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Tag ID">{site.nfcTagId || "Not set"}</Field>
            <Field label="Registered">{site.nfcRegistered ? "Yes" : "No"}</Field>
          </dl>
        </Section>

        <Section icon={CalendarDays} title="Schedule">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Start date">{site.startDate || "—"}</Field>
            <Field label="End date">{site.endDate || "Open-ended"}</Field>
            <div className="sm:col-span-2">
              <dt className="mb-1.5 text-xs font-medium uppercase tracking-wide text-grey-500">Working days</dt>
              {site.workingDays.length > 0 ? (
                <WorkingDaysSelector value={site.workingDays} readOnly size="sm" />
              ) : (
                <span className="text-sm text-grey-500">—</span>
              )}
            </div>
          </dl>
        </Section>

        <Section icon={Clock} title="General task window">
          {generalWindow.length === 0 ? (
            <p className="text-sm text-grey-500">No specific window — treated as a full 24-hour day.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {generalWindow.map((w, i) => (
                <li
                  key={w.dayOfWeek ?? i}
                  className="flex items-center justify-between rounded-lg border border-grey-100 bg-grey-50 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-on-surface">
                    {w.dayOfWeek ? DAY_LABELS[w.dayOfWeek] : "All working days"}
                  </span>
                  <span className="text-grey-600">
                    {hhmm(w.startTime) || "—"} – {hhmm(w.endTime) || "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section icon={ShieldCheck} title="Required certificates">
          {site.requiredCertificates.length === 0 ? (
            <p className="text-sm text-grey-500">None required.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {site.requiredCertificates.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-ink"
                >
                  {CERTIFICATE_TYPE_LABELS[c]}
                </span>
              ))}
            </div>
          )}
        </Section>

        <Section icon={Users} title="Cleaning templates">
          {(site.cleaningTemplates ?? []).length === 0 ? (
            <p className="text-sm text-grey-500">No templates linked.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {site.cleaningTemplates.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border border-grey-100 bg-grey-50 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-on-surface">{t.templateName ?? "Template"}</span>
                  {t.profileIndexes.length > 0 && (
                    <span className="text-xs text-grey-500">
                      Slots: {t.profileIndexes.map((n) => n + 1).join(", ")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </PanelOrModal>
  );
}
