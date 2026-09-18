"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, Upload, ShieldCheck, MapPin, ArrowRight, MoonStar } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { TimeField } from "@/components/shared/TimeField";
import { SearchableSelect, type SelectOption } from "@/features/user-management/components/SearchableSelect";
import { LocationPicker } from "@/features/user-management/components/LocationPicker";
import { useSites } from "@/features/user-management/hooks/useSites";
import { useClientCompanies } from "@/features/user-management/hooks/useClientCompanies";
import { useClients } from "@/features/user-management/hooks/useClients";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useCertificateTypes } from "@/features/users/hooks/useCertificateTypes";
import { AddCertificateTypeButton } from "@/features/users/components/AddCertificateTypeButton";
import { MANDATORY_CERTIFICATE_KEYS, isMandatoryCertificate } from "@/features/users/schemas/document.schema";
import {
  useCreateWorkOrder,
  useUpdateWorkOrder,
  useUploadWorkOrderPhotos,
  useDeleteWorkOrderPhoto,
} from "@/features/work-orders/hooks/useWorkOrders";
import type { WorkOrder } from "@/features/work-orders/schemas/workOrder.schema";
import {
  WORK_ORDER_PRICE_TYPE_LABELS,
  WORK_ORDER_PRICE_TYPE_VALUES,
  type WorkOrderPriceType,
} from "@/features/work-orders/schemas/workOrder.schema";

/** Browser URL for a stored work-order photo. */
function photoUrl(photoId: string): string {
  return `/api/work-orders/photos/${photoId}`;
}

/** Duration + overnight flag for a work window (end earlier than start = next day). */
function windowInfo(start?: string, end?: string): { overnight: boolean; duration: string } | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const s = sh * 60 + sm;
  let e = eh * 60 + em;
  const overnight = e <= s;
  if (overnight) e += 24 * 60;
  const mins = e - s;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return { overnight, duration: `${h}h${m ? ` ${m}m` : ""}` };
}

interface WorkOrderFormModalProps {
  open: boolean;
  onClose: () => void;
  /** When provided, the modal edits this work order instead of creating a new one. */
  workOrder?: WorkOrder | null;
  onCreated?: (poId: string) => void;
  onUpdated?: (poId: string) => void;
}

export function WorkOrderFormModal({ open, onClose, workOrder, onCreated, onUpdated }: WorkOrderFormModalProps) {
  const isEdit = !!workOrder;
  const create = useCreateWorkOrder();
  const update = useUpdateWorkOrder();
  const uploadPhotos = useUploadWorkOrderPhotos();
  const deletePhoto = useDeleteWorkOrderPhoto();

  const [poId, setPoId] = useState(workOrder?.poId ?? "");
  const [siteId, setSiteId] = useState(workOrder?.siteId ?? "");
  // Site selection mode — a temporary "one-time" site (default on create) vs picking an existing one.
  const [siteMode, setSiteMode] = useState<"one-time" | "existing">(isEdit ? "existing" : "one-time");
  const [otClientCompanyId, setOtClientCompanyId] = useState("");
  const [otClientId, setOtClientId] = useState("");
  const [otContactPersonName, setOtContactPersonName] = useState("");
  const [otContactNumber, setOtContactNumber] = useState("");
  const [otGoogleMapsLink, setOtGoogleMapsLink] = useState("");
  const [otStreetAddress, setOtStreetAddress] = useState("");
  const [otLatitude, setOtLatitude] = useState<number | null>(null);
  const [otLongitude, setOtLongitude] = useState<number | null>(null);
  const [otGeofenceRadius, setOtGeofenceRadius] = useState("");
  const [otNfcTagId, setOtNfcTagId] = useState("");
  const [description, setDescription] = useState(workOrder?.description ?? "");
  const [numberOfCleaners, setNumberOfCleaners] = useState(workOrder?.numberOfCleaners ?? 1);
  const [numberOfSupervisors, setNumberOfSupervisors] = useState(workOrder?.numberOfSupervisors ?? 1);
  const [startTime, setStartTime] = useState<string>(workOrder?.startTime ? workOrder.startTime.slice(0, 5) : "");
  const [endTime, setEndTime] = useState<string>(workOrder?.endTime ? workOrder.endTime.slice(0, 5) : "");
  const [priceType, setPriceType] = useState<WorkOrderPriceType>(workOrder?.priceType ?? "TOTAL_AMOUNT");
  const [priceAmount, setPriceAmount] = useState<string>(
    workOrder?.priceAmount != null ? String(workOrder.priceAmount) : "",
  );
  const [cleaningAllocatedAmount, setCleaningAllocatedAmount] = useState<string>(
    workOrder?.cleaningAllocatedAmount != null ? String(workOrder.cleaningAllocatedAmount) : "",
  );
  const [certsAll, setCertsAll] = useState<string[]>(
    Array.from(new Set([...MANDATORY_CERTIFICATE_KEYS, ...(workOrder?.requiredCertificatesAllWorkers ?? [])])),
  );
  const [certsAny, setCertsAny] = useState<string[]>(
    (workOrder?.requiredCertificatesAnyWorker ?? []).filter((k) => !isMandatoryCertificate(k)),
  );
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pending = isEdit ? update.isPending : create.isPending;
  const mutationError = isEdit ? update.error : create.error;
  const isError = isEdit ? update.isError : create.isError;

  const sitesQuery = useSites();
  const certOptions = useCertificateTypes();
  const companiesQuery = useClientCompanies();
  const clientsQuery = useClients(otClientCompanyId || undefined, { enabled: !!otClientCompanyId });
  const siteOptions: SelectOption[] = useMemo(
    () => (sitesQuery.data ?? []).map((s) => ({ value: s.id, label: s.name })),
    [sitesQuery.data],
  );
  const companyOptions: SelectOption[] = useMemo(
    () => (companiesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name, sublabel: c.email ?? undefined })),
    [companiesQuery.data],
  );
  const clientOptions: SelectOption[] = useMemo(
    () => (clientsQuery.data ?? []).map((c) => ({ value: c.id, label: c.name })),
    [clientsQuery.data],
  );

  function handleOtCompanyChange(id: string) {
    setOtClientCompanyId(id);
    setOtClientId("");
  }

  // Total amount and rate per hour are mutually exclusive — switching type starts with empty amounts.
  function handlePriceTypeChange(value: WorkOrderPriceType) {
    if (value === priceType) return;
    setPriceType(value);
    setPriceAmount("");
    setCleaningAllocatedAmount("");
  }

  // A client company with exactly one contact needs no choice — preselect it.
  useEffect(() => {
    const list = clientsQuery.data;
    if (otClientCompanyId && list && list.length === 1 && !otClientId) {
      setOtClientId(list[0]!.id);
    }
  }, [clientsQuery.data, otClientCompanyId, otClientId]);

  const previews = useMemo(() => pendingFiles.map((f) => ({ file: f, url: URL.createObjectURL(f) })), [pendingFiles]);

  /** Toggle a certificate within one requirement group, keeping the two groups mutually exclusive. */
  function toggleCert(type: string, group: "all" | "any") {
    // Mandatory certs are always required for every worker and cannot be moved or removed.
    if (isMandatoryCertificate(type)) return;
    if (group === "all") {
      setCertsAll((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
      setCertsAny((prev) => prev.filter((t) => t !== type));
    } else {
      setCertsAny((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
      setCertsAll((prev) => prev.filter((t) => t !== type));
    }
  }

  function handleClose() {
    if (pending || uploadPhotos.isPending) return;
    setFormError(null);
    create.reset();
    update.reset();
    setPendingFiles([]);
    if (!isEdit) {
      setSiteMode("one-time");
      setOtClientCompanyId("");
      setOtClientId("");
      setOtContactPersonName("");
      setOtContactNumber("");
      setOtGoogleMapsLink("");
      setOtStreetAddress("");
      setOtLatitude(null);
      setOtLongitude(null);
      setOtGeofenceRadius("");
      setOtNfcTagId("");
    }
    onClose();
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    setPendingFiles((prev) => [...prev, ...Array.from(files)]);
  }

  function validate(): string | null {
    if (!poId.trim()) return "Enter the PO ID.";
    if (!isEdit && siteMode === "one-time") {
      if (!otClientCompanyId) return "Select a client company for the one-time site.";
      if (!otClientId) return "Select a client contact for the one-time site.";
    } else if (!siteId) {
      return "Select a site.";
    }
    if (priceAmount.trim() && !(Number(priceAmount) > 0)) return "Enter a valid price greater than zero.";
    if (cleaningAllocatedAmount.trim()) {
      if (!(Number(cleaningAllocatedAmount) > 0)) return "Enter a valid cleaning allocated amount.";
      if (!priceAmount.trim()) return "Enter the price before the cleaning allocated amount.";
      if (Number(cleaningAllocatedAmount) > Number(priceAmount))
        return "Cleaning allocated amount cannot exceed the price.";
    }
    if ((startTime && !endTime) || (!startTime && endTime))
      return "Enter both a start and end time, or leave both empty.";
    return null;
  }

  function handleSubmit() {
    const error = validate();
    if (error) {
      setFormError(error);
      return;
    }
    setFormError(null);
    const trimmedPo = poId.trim();

    const parsedPrice = priceAmount.trim() ? Number(priceAmount) : undefined;
    const parsedAllocated = cleaningAllocatedAmount.trim() ? Number(cleaningAllocatedAmount) : undefined;
    const pricePayload = {
      priceType: parsedPrice != null ? priceType : undefined,
      priceAmount: parsedPrice,
      cleaningAllocatedAmount: parsedPrice != null ? parsedAllocated : undefined,
    };
    const timePayload = {
      startTime: startTime || undefined,
      endTime: endTime || undefined,
    };

    if (isEdit && workOrder) {
      update.mutate(
        {
          id: workOrder.id,
          input: {
            poId: trimmedPo,
            description: description.trim() || undefined,
            numberOfCleaners,
            numberOfSupervisors,
            ...pricePayload,
            ...timePayload,
            requiredCertificatesAllWorkers: certsAll,
            requiredCertificatesAnyWorker: certsAny,
            status: workOrder.status,
          },
        },
        {
          onSuccess: async () => {
            if (pendingFiles.length > 0) {
              await uploadPhotos.mutateAsync({ id: workOrder.id, files: pendingFiles }).catch(() => {});
            }
            onUpdated?.(trimmedPo);
            handleClose();
          },
        },
      );
      return;
    }

    const oneTime = siteMode === "one-time";
    create.mutate(
      {
        poId: trimmedPo,
        ...(oneTime
          ? {
              oneTimeSite: true,
              oneTimeSiteDetails: {
                clientCompanyId: otClientCompanyId,
                clientId: otClientId,
                contactPersonName: otContactPersonName.trim() || undefined,
                contactNumber: otContactNumber.trim() || undefined,
                googleMapsLink: otGoogleMapsLink.trim() || undefined,
                streetAddress: otStreetAddress.trim() || undefined,
                latitude: otLatitude,
                longitude: otLongitude,
                geofenceRadiusMeters: otGeofenceRadius.trim() ? Number(otGeofenceRadius) : undefined,
                nfcTagId: otNfcTagId.trim() || undefined,
              },
            }
          : { siteId }),
        description: description.trim() || undefined,
        numberOfCleaners,
        numberOfSupervisors,
        ...pricePayload,
        ...timePayload,
        requiredCertificatesAllWorkers: certsAll,
        requiredCertificatesAnyWorker: certsAny,
      },
      {
        onSuccess: async (created) => {
          if (pendingFiles.length > 0) {
            await uploadPhotos.mutateAsync({ id: created.id, files: pendingFiles }).catch(() => {});
          }
          onCreated?.(trimmedPo);
          handleClose();
        },
      },
    );
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? "Edit work order" : "New work order"}
      description="Out-of-scope client work for a site."
      maxWidthClassName="max-w-xl"
    >
      <div className="flex flex-col gap-4">
        <TextField
          label="PO ID"
          name="wo-po"
          required
          value={poId}
          onChange={(e) => setPoId(e.target.value)}
          placeholder="e.g. PO-2025-0142"
        />

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-on-surface">
            Site<span className="ml-0.5 text-error">*</span>
          </label>

          {isEdit ? (
            <SearchableSelect
              options={siteOptions}
              value={siteId || null}
              onChange={setSiteId}
              disabled
              loading={sitesQuery.isLoading}
              placeholder="Select site"
              searchPlaceholder="Search sites…"
            />
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {([
                  ["one-time", "One-time site"],
                  ["existing", "Existing site"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSiteMode(value)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                      siteMode === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-grey-300 text-on-surface hover:bg-grey-100"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {siteMode === "existing" ? (
                <SearchableSelect
                  options={siteOptions}
                  value={siteId || null}
                  onChange={setSiteId}
                  loading={sitesQuery.isLoading}
                  placeholder="Select site"
                  searchPlaceholder="Search sites…"
                />
              ) : (
                <div className="flex flex-col gap-4 rounded-xl border border-grey-200 bg-grey-50/60 p-3.5">
                  <p className="text-xs text-grey-500">
                    A temporary site is saved from the details below and named after the PO ID. It appears in
                    Operations until this work order is completed.
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <SearchableSelect
                      label="Client company"
                      required
                      options={companyOptions}
                      value={otClientCompanyId || null}
                      onChange={handleOtCompanyChange}
                      loading={companiesQuery.isLoading}
                      placeholder="Select a client company"
                      searchPlaceholder="Search client companies…"
                      emptyMessage="No client companies found."
                    />
                    <SearchableSelect
                      label="Client contact"
                      required
                      options={clientOptions}
                      value={otClientId || null}
                      onChange={setOtClientId}
                      disabled={!otClientCompanyId}
                      loading={!!otClientCompanyId && clientsQuery.isLoading}
                      placeholder={otClientCompanyId ? "Select a client" : "Select a client company first"}
                      searchPlaceholder="Search clients…"
                      emptyMessage="This client company has no clients yet."
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-primary" aria-hidden="true" />
                      <span className="text-sm font-medium text-on-surface">Location</span>
                    </div>
                    <TextField
                      label="Google Maps location link"
                      name="wo-ot-maps"
                      value={otGoogleMapsLink}
                      onChange={(e) => setOtGoogleMapsLink(e.target.value)}
                      placeholder="Paste a Google Maps URL or pick on the map"
                    />
                    <div className="rounded-xl border border-grey-200 bg-white p-3">
                      <LocationPicker
                        value={otGoogleMapsLink}
                        onChange={setOtGoogleMapsLink}
                        onCoordsChange={(coords) => {
                          setOtLatitude(coords.lat);
                          setOtLongitude(coords.lng);
                        }}
                      />
                    </div>
                    <TextField
                      label="Street address"
                      name="wo-ot-address"
                      value={otStreetAddress}
                      onChange={(e) => setOtStreetAddress(e.target.value)}
                    />
                    <TextField
                      label="Check-in geofence radius (m)"
                      name="wo-ot-geofence"
                      type="number"
                      min={0}
                      value={otGeofenceRadius}
                      onChange={(e) => setOtGeofenceRadius(e.target.value)}
                      placeholder="Defaults to 100m"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <TextField
                      label="Contact person name"
                      name="wo-ot-contact-name"
                      value={otContactPersonName}
                      onChange={(e) => setOtContactPersonName(e.target.value)}
                    />
                    <TextField
                      label="Contact number"
                      name="wo-ot-contact-number"
                      value={otContactNumber}
                      onChange={(e) => setOtContactNumber(e.target.value)}
                    />
                  </div>

                  <TextField
                    label="NFC tag id (optional)"
                    name="wo-ot-nfc"
                    value={otNfcTagId}
                    onChange={(e) => setOtNfcTagId(e.target.value)}
                    placeholder="Scan or enter the site's NFC tag id"
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Cleaners"
            name="wo-cleaners"
            type="number"
            min={0}
            value={numberOfCleaners}
            onChange={(e) => setNumberOfCleaners(Math.max(0, Number(e.target.value) || 0))}
          />
          <TextField
            label="Supervisors"
            name="wo-supervisors"
            type="number"
            min={0}
            value={numberOfSupervisors}
            onChange={(e) => setNumberOfSupervisors(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-on-surface">Work window (optional)</span>
          <div className="rounded-2xl border border-grey-200 bg-grey-100/40 p-3">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <TimeField label="Start" value={startTime} onChange={setStartTime} />
              </div>
              <ArrowRight size={16} className="mb-3 shrink-0 text-grey-400" aria-hidden="true" />
              <div className="flex-1">
                <TimeField label="End" value={endTime} onChange={setEndTime} />
              </div>
            </div>
            {(() => {
              const info = windowInfo(startTime, endTime);
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
          <p className="text-xs text-grey-500">
            Set an end earlier than the start for an overnight window. Cleaners can check in from 5 hours
            before the start, and are auto checked-out 5 hours after the end.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-on-surface">Price</span>
          <div className="flex flex-wrap gap-2">
            {WORK_ORDER_PRICE_TYPE_VALUES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handlePriceTypeChange(value)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  priceType === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-grey-300 text-on-surface hover:bg-grey-100"
                }`}
              >
                {WORK_ORDER_PRICE_TYPE_LABELS[value]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label={priceType === "RATE_PER_HOUR" ? "Client rate per hour (AUD)" : "Client total amount (AUD)"}
              name="wo-price"
              type="number"
              min={0}
              step="0.01"
              value={priceAmount}
              onChange={(e) => setPriceAmount(e.target.value)}
              placeholder="e.g. 250.00"
            />
            <TextField
              label={priceType === "RATE_PER_HOUR" ? "Cleaning rate per hour (AUD)" : "Cleaning allocated amount (AUD)"}
              name="wo-cleaning-amount"
              type="number"
              min={0}
              step="0.01"
              value={cleaningAllocatedAmount}
              onChange={(e) => setCleaningAllocatedAmount(e.target.value)}
              placeholder={priceType === "RATE_PER_HOUR" ? "e.g. 25.00" : "e.g. 300.00"}
            />
          </div>
          <p className="text-xs text-grey-500">
            The client amount is what you charge; the cleaning amount is what you allocate to the cleaners.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="wo-desc" className="text-sm font-medium text-on-surface">
            What needs to be done
          </label>
          <textarea
            id="wo-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="e.g. Clean the outside fence along the north boundary."
            className="rounded-xl border border-grey-300 bg-white px-3.5 py-2.5 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Required certificates */}
        <div className="flex flex-col gap-3 rounded-xl border border-grey-200 bg-grey-50/60 p-3.5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-primary" aria-hidden="true" />
            <span className="text-sm font-medium text-on-surface">Required certificates</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-grey-500">
              Mandatory for all workers
            </span>
            <p className="text-xs text-grey-500">
              Every cleaner and supervisor assigned to this work order must hold a verified, non-expired
              copy of each certificate below. VEVO / Working Rights, Police Check and ABN Registration are
              mandatory and always required.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(certOptions.data ?? []).map((opt) => {
                const mandatory = isMandatoryCertificate(opt.key);
                return (
                  <label key={`all-${opt.key}`} className="flex items-center gap-2 text-sm text-on-surface">
                    <input
                      type="checkbox"
                      checked={mandatory || certsAll.includes(opt.key)}
                      disabled={mandatory}
                      onChange={() => toggleCert(opt.key, "all")}
                      className="h-4 w-4 rounded border-grey-300 text-primary focus:ring-primary/30"
                    />
                    <span className="flex items-center gap-1.5">
                      {opt.label}
                      {mandatory && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                          Mandatory
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
            <AddCertificateTypeButton onCreated={(key) => toggleCert(key, "all")} />
          </div>
          <div className="flex flex-col gap-1.5 border-t border-grey-200 pt-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-grey-500">
              At least one worker
            </span>
            <p className="text-xs text-grey-500">
              At least one assigned worker (cleaner or supervisor) must hold each certificate below. A
              supervisor holding it also satisfies it for the cleaners.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(certOptions.data ?? []).filter((opt) => !isMandatoryCertificate(opt.key)).map((opt) => (
                <label key={`any-${opt.key}`} className="flex items-center gap-2 text-sm text-on-surface">
                  <input
                    type="checkbox"
                    checked={certsAny.includes(opt.key)}
                    onChange={() => toggleCert(opt.key, "any")}
                    className="h-4 w-4 rounded border-grey-300 text-primary focus:ring-primary/30"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            <AddCertificateTypeButton onCreated={(key) => toggleCert(key, "any")} />
          </div>
        </div>

        {/* Photos */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-on-surface">Photos from the client</span>
          <div className="flex flex-wrap gap-2">
            {isEdit &&
              (workOrder?.photos ?? []).map((p) => (
                <div key={p.id} className="relative h-20 w-20 overflow-hidden rounded-lg border border-grey-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl(p.id)} alt={p.originalFilename ?? "Work order photo"} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() => workOrder && deletePhoto.mutate({ id: workOrder.id, photoId: p.id })}
                    className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <X size={12} aria-hidden="true" />
                  </button>
                </div>
              ))}
            {previews.map((p, i) => (
              <div key={p.url} className="relative h-20 w-20 overflow-hidden rounded-lg border border-grey-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.file.name} className="h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-grey-300 text-xs text-grey-500 transition-colors hover:border-primary hover:text-ink"
            >
              <Upload size={16} aria-hidden="true" />
              Add
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.currentTarget.value = "";
              }}
            />
          </div>
        </div>

        {(formError || isError) && (
          <p className="text-sm font-medium text-error">
            {formError ?? getErrorMessage(mutationError)}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-grey-300 px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={pending || uploadPhotos.isPending}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {pending || uploadPhotos.isPending ? "Saving…" : isEdit ? "Save changes" : "Create work order"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
