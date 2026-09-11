"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Nfc,
  Loader2,
  Clock,
  ArrowRight,
  MoonStar,
  Building2,
  User,
  MapPin,
  CalendarDays,
  ShieldCheck,
  Settings2,
  Layers,
} from "lucide-react";
import { PanelOrModal } from "@/components/shared/PanelOrModal";
import { TextField } from "@/components/shared/TextField";
import { TimeField } from "@/components/shared/TimeField";
import { PhoneNumberField } from "@/components/shared/PhoneNumberField";
import { PillButton } from "@/components/shared/PillButton";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { SearchableSelect, type SelectOption } from "./SearchableSelect";
import { LocationPicker } from "./LocationPicker";
import { FloorsSection } from "./FloorsSection";
import { FloorsModal } from "./FloorsModal";
import { WorkingDaysSelector } from "./WorkingDaysSelector";
import { CleaningTemplatesSection } from "./CleaningTemplatesSection";
import {
  SiteFormSchema,
  SITE_TYPE_LABELS,
  SITE_TYPE_VALUES,
  DAY_OF_WEEK_VALUES,
  type Site,
  type SiteFormInput,
  type DayOfWeek,
} from "@/features/user-management/schemas/site.schema";
import { useClientCompanies } from "@/features/user-management/hooks/useClientCompanies";
import { useClients } from "@/features/user-management/hooks/useClients";
import { useCreateSite, useUpdateSite } from "@/features/user-management/hooks/useSites";
import {
  CERTIFICATE_TYPES,
  CERTIFICATE_TYPE_LABELS,
} from "@/features/users/schemas/document.schema";
import { isNfcSupported, readNfcTag, NfcError } from "@/lib/nfc";
import { cn } from "@/lib/utils/cn";

interface SiteFormModalProps {
  open: boolean;
  onClose: () => void;
  site?: Site | null;
  embedded?: boolean;
  /** Register/edit a lighter work-order-only site (no working days / general-task window). */
  workOrderSite?: boolean;
}

/** Duration + overnight flag for a general-task window (end earlier than start = next day). */
function windowInfo(start?: string, end?: string): { overnight: boolean; duration: string } | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let s = sh * 60 + sm;
  let e = eh * 60 + em;
  const overnight = e <= s;
  if (overnight) e += 24 * 60;
  const mins = e - s;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return { overnight, duration: `${h}h${m ? ` ${m}m` : ""}` };
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

/** A titled card that groups related form fields — mirrors the read-only Site view sections. */
function FormSection({
  icon: Icon,
  title,
  description,
  className,
  children,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border border-grey-200 bg-surface p-4 sm:p-5", className)}>
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-ink">
          <Icon size={16} />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-on-surface">{title}</h3>
          {description && <p className="text-xs text-grey-500">{description}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

const EMPTY: SiteFormInput = {
  clientCompanyId: "",
  clientId: "",
  name: "",
  siteType: "GENERAL",
  numberOfCleaners: 1,
  contactPersonName: "",
  contactNumber: "",
  googleMapsLink: "",
  streetAddress: "",
  latitude: null,
  longitude: null,
  geofenceRadiusMeters: null,
  nfcTagId: "",
  startDate: "",
  endDate: "",
  workingDays: [],
  generalTaskTimeMode: "SINGLE",
  generalTaskStartTime: "",
  generalTaskEndTime: "",
  generalTaskDayTimes: [],
  requiredCertificates: [],
  clientSiteManagementEnabled: false,
  worksOnPublicHolidays: false,
  workOrderSite: false,
  cleaningTemplates: [],
};

export function SiteFormModal({ open, onClose, site, embedded, workOrderSite = false }: SiteFormModalProps) {
  const isEdit = !!site;
  // A site is treated as work-order-only when the caller opts in, or when editing one.
  const isWorkOrderSite = workOrderSite || !!site?.workOrderSite;
  const companiesQuery = useClientCompanies();
  const createMutation = useCreateSite();
  const updateMutation = useUpdateSite();
  const active = isEdit ? updateMutation : createMutation;

  // On create, chain straight into a dedicated Floors modal (whose own "manage areas"
  // action opens a further Areas modal) instead of showing floors inline in this modal.
  const [floorsModalSite, setFloorsModalSite] = useState<Site | null>(null);
  const [nfcScanning, setNfcScanning] = useState(false);
  const [nfcMessage, setNfcMessage] = useState<string | null>(null);
  const nfcSupported = isNfcSupported();

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SiteFormInput>({
    resolver: zodResolver(SiteFormSchema),
    defaultValues: EMPTY,
  });

  const selectedCompanyId = watch("clientCompanyId");
  const selectedClientId = watch("clientId");
  const mapsLink = watch("googleMapsLink") ?? "";

  const clientsQuery = useClients(selectedCompanyId || undefined, { enabled: !!selectedCompanyId });

  const companyOptions: SelectOption[] = useMemo(
    () => (companiesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name, sublabel: c.email ?? undefined })),
    [companiesQuery.data],
  );
  const clientOptions: SelectOption[] = useMemo(
    () => (clientsQuery.data ?? []).map((c) => ({ value: c.id, label: c.name, sublabel: c.email ?? undefined })),
    [clientsQuery.data],
  );
  const siteTypeOptions: SelectOption[] = useMemo(
    () => SITE_TYPE_VALUES.map((v) => ({ value: v, label: SITE_TYPE_LABELS[v] })),
    [],
  );

  // Reset the form each time the modal opens (create vs edit).
  useEffect(() => {
    if (!open) return;
    reset(
      site
        ? {
            clientCompanyId: site.clientCompanyId,
            clientId: site.clientId,
            name: site.name,
            siteType: site.siteType ?? "GENERAL",
            numberOfCleaners: site.numberOfCleaners ?? 1,
            contactPersonName: site.contactPersonName ?? "",
            contactNumber: site.contactNumber ?? "",
            googleMapsLink: site.googleMapsLink ?? "",
            streetAddress: site.streetAddress ?? "",
            latitude: site.latitude ?? null,
            longitude: site.longitude ?? null,
            geofenceRadiusMeters: site.geofenceRadiusMeters ?? null,
            nfcTagId: site.nfcTagId ?? "",
            startDate: site.startDate ?? "",
            endDate: site.endDate ?? "",
            workingDays: site.workingDays ?? [],
            generalTaskTimeMode: site.generalTaskTimeMode ?? "SINGLE",
            generalTaskStartTime: (site.generalTaskStartTime ?? "").slice(0, 5),
            generalTaskEndTime: (site.generalTaskEndTime ?? "").slice(0, 5),
            generalTaskDayTimes: (site.generalTaskDayTimes ?? []).map((d) => ({
              dayOfWeek: d.dayOfWeek,
              startTime: (d.startTime ?? "").slice(0, 5),
              endTime: (d.endTime ?? "").slice(0, 5),
            })),
            requiredCertificates: site.requiredCertificates ?? [],
            clientSiteManagementEnabled: site.clientSiteManagementEnabled ?? false,
            worksOnPublicHolidays: site.worksOnPublicHolidays ?? false,
            workOrderSite: site.workOrderSite ?? false,
            cleaningTemplates: (site.cleaningTemplates ?? []).map((t) => ({
              templateId: t.templateId,
              profileIndexes: t.profileIndexes ?? [],
            })),
          }
        : { ...EMPTY, workOrderSite, siteType: workOrderSite ? "BUILDING_CLEANING" : "GENERAL" },
    );
    createMutation.reset();
    updateMutation.reset();
    setFloorsModalSite(null);
    setNfcMessage(null);
    setNfcScanning(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, site]);

  // Auto-select the only client when a client-company has exactly one.
  const autoSelectGuard = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedCompanyId) return;
    if (clientsQuery.isLoading || !clientsQuery.data) return;
    // Only auto-select once per company, and never override an existing choice.
    if (autoSelectGuard.current === selectedCompanyId) return;
    autoSelectGuard.current = selectedCompanyId;
    if (clientsQuery.data.length === 1 && !selectedClientId) {
      setValue("clientId", clientsQuery.data[0].id, { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId, clientsQuery.data, clientsQuery.isLoading]);

  // Stable identities so LocationPicker's internal effect doesn't re-fire (and re-trigger
  // setValue) on every parent render — see LocationPicker's "React to the link being
  // edited/pasted" effect, which depends on these via its `applyLocation` callback.
  const handleMapsLinkChange = useCallback(
    (link: string) => setValue("googleMapsLink", link, { shouldValidate: true }),
    [setValue],
  );
  const handleCoordsChange = useCallback(
    ({ lat, lng }: { lat: number; lng: number }) => {
      setValue("latitude", lat, { shouldValidate: true });
      setValue("longitude", lng, { shouldValidate: true });
    },
    [setValue],
  );

  function handleCompanyChange(next: string) {
    setValue("clientCompanyId", next, { shouldValidate: true });
    setValue("clientId", "", { shouldValidate: false });
    autoSelectGuard.current = null;
  }

  async function handleScanNfc() {
    setNfcMessage(null);
    setNfcScanning(true);
    try {
      const uid = await readNfcTag();
      setValue("nfcTagId", uid, { shouldValidate: true });
      setNfcMessage(`Tag captured: ${uid}`);
    } catch (err) {
      setNfcMessage(err instanceof NfcError ? err.message : "Failed to read the NFC tag.");
    } finally {
      setNfcScanning(false);
    }
  }

  function onSubmit(values: SiteFormInput) {
    if (isEdit && site) {
      updateMutation.mutate({ id: site.id, input: values }, { onSuccess: onClose });
    } else {
      createMutation.mutate(values, {
        onSuccess: (created) => {
          onClose();
          setFloorsModalSite(created);
        },
      });
    }
  }

  return (
    <>
      <PanelOrModal
        embedded={embedded}
        open={open}
        onClose={onClose}
        title={isEdit ? (isWorkOrderSite ? "Edit work order site" : "Edit site") : (isWorkOrderSite ? "Add a work order site" : "Add a site")}
        description={isWorkOrderSite
          ? "A lighter site used only for work orders — shifts and cleaner slots, no general working days."
          : "Select a client-company and client, then enter the site details."}
        maxWidthClassName="max-w-2xl"
        embeddedMaxWidthClassName="w-full"
      >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FormSection icon={Building2} title="Client & site details" className="lg:col-span-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="clientCompanyId"
            render={({ field }) => (
              <SearchableSelect
                label="Client-company"
                required
                options={companyOptions}
                value={field.value || null}
                onChange={handleCompanyChange}
                loading={companiesQuery.isLoading}
                placeholder="Select a client-company"
                searchPlaceholder="Search client-companies…"
                emptyMessage="No client-companies found. Create one first."
                error={errors.clientCompanyId?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="clientId"
            render={({ field }) => (
              <SearchableSelect
                label="Client"
                required
                options={clientOptions}
                value={field.value || null}
                onChange={field.onChange}
                disabled={!selectedCompanyId}
                loading={!!selectedCompanyId && clientsQuery.isLoading}
                placeholder={selectedCompanyId ? "Select a client" : "Select a client-company first"}
                searchPlaceholder="Search clients…"
                emptyMessage="This client-company has no clients yet."
                error={errors.clientId?.message}
                hint={
                  selectedCompanyId && clientOptions.length === 1
                    ? "Only one client — selected automatically."
                    : undefined
                }
              />
            )}
          />
        </div>

        <TextField label="Site name" required error={errors.name?.message} {...register("name")} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="siteType"
            render={({ field }) => (
              <SearchableSelect
                label="Site type"
                required
                options={siteTypeOptions}
                value={field.value || "GENERAL"}
                onChange={field.onChange}
                placeholder="Select a site type"
                searchPlaceholder="Search site types…"
                emptyMessage="No site types"
                error={errors.siteType?.message}
              />
            )}
          />
          <TextField
            label="Number of cleaners"
            type="number"
            min={0}
            readOnly={isEdit}
            className={isEdit ? "bg-grey-50 text-grey-500" : undefined}
            hint={
              isEdit
                ? "To add or remove cleaners, use “Cleaner slots” — it guides copying a cleaner’s tasks or removing an empty slot safely."
                : "Creates this many cleaner slots (profiles). Assign cleaners to the slots after saving."
            }
            error={errors.numberOfCleaners?.message}
            {...register("numberOfCleaners", { valueAsNumber: true })}
          />
        </div>
        </FormSection>

        <FormSection icon={User} title="Contact person">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Contact person name"
            error={errors.contactPersonName?.message}
            {...register("contactPersonName")}
          />
          <Controller
            control={control}
            name="contactNumber"
            render={({ field }) => (
              <PhoneNumberField
                label="Contact number"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                error={errors.contactNumber?.message}
              />
            )}
          />
        </div>
        </FormSection>

        <FormSection icon={MapPin} title="Location" className="lg:col-span-2">
        <TextField
          label="Google Maps location link"
          placeholder="Paste a Google Maps URL or pick on the map"
          error={errors.googleMapsLink?.message}
          {...register("googleMapsLink")}
        />

        <div className="rounded-xl border border-grey-200 bg-grey-50 p-3">
          <LocationPicker
            value={mapsLink}
            onChange={handleMapsLinkChange}
            onCoordsChange={handleCoordsChange}
          />
        </div>

        <TextField label="Street address" error={errors.streetAddress?.message} {...register("streetAddress")} />
        </FormSection>

        <FormSection icon={Nfc} title="NFC check-in tag">
        <div className="flex flex-col gap-3">
          <p className="text-xs text-grey-500">
            Register the tag mounted at this site. Cleaners tap it to check in; if a device has no NFC,
            check-in falls back to matching their location against the map point above.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <TextField
                label="NFC tag id"
                placeholder="Scan a tag or enter its id manually"
                error={errors.nfcTagId?.message}
                {...register("nfcTagId")}
              />
            </div>
            {nfcSupported && (
              <button
                type="button"
                onClick={handleScanNfc}
                disabled={nfcScanning}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-teal px-4 text-sm font-semibold text-teal transition-colors hover:bg-teal/10 disabled:opacity-60"
              >
                {nfcScanning ? (
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Nfc size={16} aria-hidden="true" />
                )}
                {nfcScanning ? "Scanning…" : "Scan tag"}
              </button>
            )}
          </div>
          {!nfcSupported && (
            <p className="text-xs text-grey-500">
              NFC scanning isn&apos;t available on this device — enter the tag id manually, or register it later from an
              Android device.
            </p>
          )}
          {nfcMessage && <p className="text-xs font-medium text-teal">{nfcMessage}</p>}
        </div>
        </FormSection>

        <FormSection icon={CalendarDays} title="Schedule & working days" className={cn(isWorkOrderSite && "hidden")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Site start date"
            type="date"
            error={errors.startDate?.message}
            {...register("startDate")}
          />
          <TextField
            label="Site end date"
            type="date"
            error={errors.endDate?.message}
            {...register("endDate")}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-on-surface">Working days</span>
          <Controller
            control={control}
            name="workingDays"
            render={({ field }) => (
              <WorkingDaysSelector
                value={field.value ?? []}
                onChange={field.onChange}
                error={errors.workingDays?.message}
              />
            )}
          />
          <p className="text-xs text-grey-500">
            General assignments are scheduled only on these days, until the site end date.
          </p>
        </div>
        </FormSection>

        <FormSection icon={ShieldCheck} title="Required certificates" className="lg:col-span-2">
        <div className="flex flex-col gap-2">
          <p className="text-xs text-grey-500">
            Only cleaners and supervisors holding a verified, non-expired copy of every selected
            certificate can be assigned to this site.
          </p>
          <Controller
            control={control}
            name="requiredCertificates"
            render={({ field }) => {
              const selected = new Set(field.value ?? []);
              return (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {CERTIFICATE_TYPES.map((type) => {
                    const checked = selected.has(type);
                    return (
                      <label
                        key={type}
                        className="flex items-center gap-2 rounded-lg border border-grey-200 px-3 py-2 text-sm text-on-surface hover:bg-grey-50"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-grey-300"
                          checked={checked}
                          onChange={(e) => {
                            const next = new Set(selected);
                            if (e.target.checked) next.add(type);
                            else next.delete(type);
                            field.onChange([...next]);
                          }}
                        />
                        <span>{CERTIFICATE_TYPE_LABELS[type]}</span>
                      </label>
                    );
                  })}
                </div>
              );
            }}
          />
        </div>
        </FormSection>

        <FormSection icon={Settings2} title="Options" className={cn(isWorkOrderSite && "hidden")}>
        <label className="flex items-start gap-3 rounded-lg border border-grey-200 p-3">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-grey-300"
            {...register("clientSiteManagementEnabled")}
          />
          <span>
            <span className="block text-sm font-medium text-on-surface">Enable Client Site Management view</span>
            <span className="block text-xs text-grey-500">
              When on, this client can see this site's weekly schedule in their Client Site Management tab.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-lg border border-grey-200 p-3">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-grey-300"
            {...register("worksOnPublicHolidays")}
          />
          <span>
            <span className="block text-sm font-medium text-on-surface">Works on public holidays</span>
            <span className="block text-xs text-grey-500">
              When off, recurring scheduled tasks skip public holidays for this site. You can still
              add tasks manually on a holiday. Turn on for sites that operate on holidays.
            </span>
          </span>
        </label>
        </FormSection>

        <FormSection icon={Clock} title="General task service time" className={cn("lg:col-span-2", isWorkOrderSite && "hidden")}>
        <div className="flex flex-col gap-3">
          <p className="text-xs text-grey-500">
            The window the client allows for general cleaning. Use one window for all working days,
            or set a different window per day. Set an end earlier than the start for an overnight
            window (e.g. 10:00 PM → 6:00 AM next day).
          </p>

          <Controller
            control={control}
            name="generalTaskTimeMode"
            render={({ field }) => (
              <div className="inline-flex w-fit rounded-full border border-grey-200 p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => field.onChange("SINGLE")}
                  className={
                    field.value !== "PER_DAY"
                      ? "rounded-full bg-primary px-3 py-1.5 text-on-primary"
                      : "rounded-full px-3 py-1.5 text-grey-500 hover:text-on-surface"
                  }
                >
                  Same time for all days
                </button>
                <button
                  type="button"
                  onClick={() => field.onChange("PER_DAY")}
                  className={
                    field.value === "PER_DAY"
                      ? "rounded-full bg-primary px-3 py-1.5 text-on-primary"
                      : "rounded-full px-3 py-1.5 text-grey-500 hover:text-on-surface"
                  }
                >
                  Different time per day
                </button>
              </div>
            )}
          />

          {watch("generalTaskTimeMode") === "PER_DAY" ? (
            (() => {
              const working = watch("workingDays") ?? [];
              const orderedDays = DAY_OF_WEEK_VALUES.filter((d) => working.includes(d));
              if (orderedDays.length === 0) {
                return (
                  <p className="rounded-xl border border-dashed border-grey-200 px-3 py-4 text-center text-xs text-grey-500">
                    Select working days above to set a time for each day.
                  </p>
                );
              }
              const dayTimes = watch("generalTaskDayTimes") ?? [];
              const setDay = (day: DayOfWeek, patch: { startTime?: string; endTime?: string }) => {
                const exists = dayTimes.some((x) => x.dayOfWeek === day);
                const next = exists
                  ? dayTimes.map((x) => (x.dayOfWeek === day ? { ...x, ...patch } : x))
                  : [...dayTimes, { dayOfWeek: day, startTime: "", endTime: "", ...patch }];
                setValue("generalTaskDayTimes", next, { shouldValidate: true });
              };
              return (
                <div className="flex flex-col gap-2">
                  {orderedDays.map((day) => {
                    const entry = dayTimes.find((x) => x.dayOfWeek === day);
                    const info = windowInfo(entry?.startTime, entry?.endTime);
                    return (
                      <div key={day} className="rounded-2xl border border-grey-200 bg-grey-100/40 p-3">
                        <div className="flex items-end gap-2">
                          <span className="mb-3 w-20 shrink-0 text-sm font-medium text-on-surface">
                            {DAY_LABELS[day]}
                          </span>
                          <div className="flex-1">
                            <TimeField
                              label="Start"
                              value={entry?.startTime ?? ""}
                              onChange={(v) => setDay(day, { startTime: v })}
                            />
                          </div>
                          <ArrowRight size={16} className="mb-3 shrink-0 text-grey-400" aria-hidden="true" />
                          <div className="flex-1">
                            <TimeField
                              label="End"
                              value={entry?.endTime ?? ""}
                              onChange={(v) => setDay(day, { endTime: v })}
                            />
                          </div>
                        </div>
                        {info && (
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-ink">
                              {info.duration}
                            </span>
                            {info.overnight && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-600">
                                <MoonStar size={12} aria-hidden="true" />
                                Overnight — ends next day
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()
          ) : (
            <div className="rounded-2xl border border-grey-200 bg-grey-100/40 p-3">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Controller
                    control={control}
                    name="generalTaskStartTime"
                    render={({ field }) => (
                      <TimeField
                        label="Start"
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.generalTaskStartTime?.message}
                      />
                    )}
                  />
                </div>
                <ArrowRight size={16} className="mb-3 shrink-0 text-grey-400" aria-hidden="true" />
                <div className="flex-1">
                  <Controller
                    control={control}
                    name="generalTaskEndTime"
                    render={({ field }) => (
                      <TimeField
                        label="End"
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.generalTaskEndTime?.message}
                      />
                    )}
                  />
                </div>
              </div>
              {(() => {
                const info = windowInfo(watch("generalTaskStartTime"), watch("generalTaskEndTime"));
                if (!info) return null;
                return (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-ink">
                      {info.duration}
                    </span>
                    {info.overnight && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-600">
                        <MoonStar size={12} aria-hidden="true" />
                        Overnight — ends next day
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
        </FormSection>

        {watch("siteType") === "HOTEL" && (
          <FormSection icon={Layers} title="Cleaning templates" className="lg:col-span-2">
            <Controller
              control={control}
              name="cleaningTemplates"
              render={({ field }) => (
                <CleaningTemplatesSection
                  value={field.value ?? []}
                  onChange={field.onChange}
                  numberOfCleaners={watch("numberOfCleaners") ?? 0}
                  error={errors.cleaningTemplates?.message}
                />
              )}
            />
          </FormSection>
        )}

        {isEdit && site && (
          <FormSection icon={Layers} title="Floors & areas" className="lg:col-span-2">
            <FloorsSection siteId={site.id} />
          </FormSection>
        )}
        </div>

        {active.isError && (
          <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
            {getErrorMessage(active.error)}
          </p>
        )}

        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-full border border-grey-300 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100"
          >
            Cancel
          </button>
          <PillButton type="submit" variant="teal" className="h-11 flex-1" disabled={active.isPending}>
            {active.isPending ? "Saving…" : isEdit ? "Save changes" : "Create site"}
          </PillButton>
        </div>
      </form>
      </PanelOrModal>

      <FloorsModal
        open={!!floorsModalSite}
        onClose={() => setFloorsModalSite(null)}
        siteId={floorsModalSite?.id ?? ""}
        siteName={floorsModalSite?.name}
      />
    </>
  );
}
