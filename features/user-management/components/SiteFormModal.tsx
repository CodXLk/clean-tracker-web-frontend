"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Nfc, Loader2 } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { PhoneNumberField } from "@/components/shared/PhoneNumberField";
import { PillButton } from "@/components/shared/PillButton";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { SearchableSelect, type SelectOption } from "./SearchableSelect";
import { LocationPicker } from "./LocationPicker";
import { FloorsSection } from "./FloorsSection";
import { FloorsModal } from "./FloorsModal";
import { WorkingDaysSelector } from "./WorkingDaysSelector";
import { SiteFormSchema, type Site, type SiteFormInput } from "@/features/user-management/schemas/site.schema";
import { useClientCompanies } from "@/features/user-management/hooks/useClientCompanies";
import { useClients } from "@/features/user-management/hooks/useClients";
import { useCreateSite, useUpdateSite } from "@/features/user-management/hooks/useSites";
import { isNfcSupported, readNfcTag, NfcError } from "@/lib/nfc";

interface SiteFormModalProps {
  open: boolean;
  onClose: () => void;
  site?: Site | null;
}

const EMPTY: SiteFormInput = {
  clientCompanyId: "",
  clientId: "",
  name: "",
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
};

export function SiteFormModal({ open, onClose, site }: SiteFormModalProps) {
  const isEdit = !!site;
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

  // Reset the form each time the modal opens (create vs edit).
  useEffect(() => {
    if (!open) return;
    reset(
      site
        ? {
            clientCompanyId: site.clientCompanyId,
            clientId: site.clientId,
            name: site.name,
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
          }
        : EMPTY,
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
      <Modal
        open={open}
        onClose={onClose}
        title={isEdit ? "Edit site" : "Add a site"}
        description="Select a client-company and client, then enter the site details."
      >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
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

        <TextField label="Site name" required error={errors.name?.message} {...register("name")} />
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

        <div className="flex flex-col gap-3 rounded-xl border border-grey-200 bg-grey-50 p-3">
          <div className="flex items-center gap-2">
            <Nfc size={16} className="text-teal" aria-hidden="true" />
            <span className="text-sm font-medium text-on-surface">NFC check-in tag</span>
          </div>
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

      {isEdit && site && (
        <div className="mt-5 flex flex-col gap-3">
          <FloorsSection siteId={site.id} />
        </div>
      )}
      </Modal>

      <FloorsModal
        open={!!floorsModalSite}
        onClose={() => setFloorsModalSite(null)}
        siteId={floorsModalSite?.id ?? ""}
        siteName={floorsModalSite?.name}
      />
    </>
  );
}
