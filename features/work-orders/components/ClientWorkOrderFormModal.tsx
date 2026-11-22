"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowRight, MapPin, MoonStar, Upload, X } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { TimeField } from "@/components/shared/TimeField";
import { SearchableSelect, type SelectOption } from "@/features/user-management/components/SearchableSelect";
import { LocationPicker } from "@/features/user-management/components/LocationPicker";
import { SITE_TYPE_LABELS, SITE_TYPE_VALUES } from "@/features/user-management/schemas/site.schema";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useClientSiteOptions } from "@/features/complaints/hooks/useClientComplaints";
import { useCreateClientWorkOrder, useUploadWorkOrderPhotos } from "@/features/work-orders/hooks/useWorkOrders";
import type { WorkOrder } from "@/features/work-orders/schemas/workOrder.schema";

const MAX_PHOTOS = 20;

function windowInfo(start?: string, end?: string): { overnight: boolean; duration: string } | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const s = sh * 60 + sm;
  let e = eh * 60 + em;
  const overnight = e <= s;
  if (overnight) e += 24 * 60;
  const mins = e - s;
  return { overnight, duration: `${Math.floor(mins / 60)}h${mins % 60 ? ` ${mins % 60}m` : ""}` };
}

interface ClientWorkOrderFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (workOrder: WorkOrder) => void;
}

/**
 * Client portal: request a work order. Staffing, pricing, certificates and outsourcing are left to
 * management, and the client company/contact come from the login. A PO number is optional — we
 * generate one when it's left blank.
 */
export function ClientWorkOrderFormModal({ open, onClose, onCreated }: ClientWorkOrderFormModalProps) {
  const sitesQuery = useClientSiteOptions(open);
  const create = useCreateClientWorkOrder();
  const uploadPhotos = useUploadWorkOrderPhotos();

  const [siteMode, setSiteMode] = useState<"existing" | "new">("existing");
  const [siteId, setSiteId] = useState("");
  const [siteName, setSiteName] = useState("");
  const [siteType, setSiteType] = useState("BUILDING_CLEANING");
  const [mapsLink, setMapsLink] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [poId, setPoId] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startNote, setStartNote] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const siteOptions: SelectOption[] = useMemo(
    () => (sitesQuery.data ?? []).map((s) => ({ value: s.id, label: s.name })),
    [sitesQuery.data],
  );
  const siteTypeOptions: SelectOption[] = useMemo(
    () => SITE_TYPE_VALUES.filter((v) => v !== "WORK_ORDER").map((v) => ({ value: v, label: SITE_TYPE_LABELS[v] })),
    [],
  );
  const previews = useMemo(() => files.map((f) => ({ file: f, url: URL.createObjectURL(f) })), [files]);
  const pending = create.isPending || uploadPhotos.isPending;
  const info = windowInfo(startTime, endTime);

  function reset() {
    setSiteMode("existing");
    setSiteId("");
    setSiteName("");
    setSiteType("BUILDING_CLEANING");
    setMapsLink("");
    setStreetAddress("");
    setLat(null);
    setLng(null);
    setContactName("");
    setContactNumber("");
    setPoId("");
    setDescription("");
    setStartDate("");
    setStartNote("");
    setStartTime("");
    setEndTime("");
    setFiles([]);
    setFormError(null);
    create.reset();
  }

  function close() {
    if (pending) return;
    reset();
    onClose();
  }

  function validate(): string | null {
    if (siteMode === "existing" && !siteId) return "Select one of your sites, or add a new site.";
    if (siteMode === "new") {
      if (!siteName.trim()) return "Enter the site name.";
      if (lat == null || lng == null) return "Pick the site's location on the map.";
    }
    if (!description.trim()) return "Describe what needs to be done.";
    if (!startTime && endTime) return "Enter a start time when setting an end time.";
    if (startTime && endTime && startTime === endTime) return "The work window's start and end can't be the same.";
    return null;
  }

  async function submit() {
    if (pending) return;
    const error = validate();
    if (error) return setFormError(error);
    setFormError(null);
    try {
      const created = await create.mutateAsync({
        ...(siteMode === "existing"
          ? { siteId }
          : {
              newSite: true,
              siteName: siteName.trim(),
              siteType,
              googleMapsLink: mapsLink.trim() || undefined,
              streetAddress: streetAddress.trim() || undefined,
              latitude: lat,
              longitude: lng,
              siteContactName: contactName.trim() || undefined,
              siteContactNumber: contactNumber.trim() || undefined,
            }),
        poId: poId.trim() || undefined,
        description: description.trim(),
        startDate: startDate || undefined,
        startNote: startNote.trim() || undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
      });
      let saved = created;
      if (files.length > 0) {
        try {
          saved = await uploadPhotos.mutateAsync({ id: created.id, files });
        } catch (e) {
          setFormError(`Your request was sent, but the photos couldn't be uploaded: ${getErrorMessage(e)}`);
          onCreated?.(created);
          return;
        }
      }
      onCreated?.(saved);
      reset();
      onClose();
    } catch {
      // create.error is shown below
    }
  }

  const modeButton = (value: "existing" | "new", label: string) => (
    <button
      key={value}
      type="button"
      onClick={() => setSiteMode(value)}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
        siteMode === value ? "border-ink bg-ink text-white" : "border-grey-300 text-on-surface hover:bg-grey-100"
      }`}
    >
      {label}
    </button>
  );

  return (
    <Modal
      open={open}
      onClose={close}
      title="Request a work order"
      description="Tell us about the extra work you need. We'll review it and confirm the details."
      maxWidthClassName="max-w-xl"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-on-surface">
            Site<span className="ml-0.5 text-error">*</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {modeButton("existing", "One of my sites")}
            {modeButton("new", "A new site")}
          </div>

          {siteMode === "existing" ? (
            <SearchableSelect
              options={siteOptions}
              value={siteId || null}
              onChange={setSiteId}
              loading={sitesQuery.isLoading}
              placeholder="Select your site"
              searchPlaceholder="Search by site name…"
              emptyMessage="You don't have any sites yet — add a new site."
            />
          ) : (
            <div className="flex flex-col gap-4 rounded-xl border border-grey-200 bg-grey-50/60 p-3.5">
              <TextField
                label="Site name"
                name="cwo-site-name"
                required
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="e.g. Warehouse 3 car park"
              />
              <SearchableSelect
                label="Site type"
                required
                options={siteTypeOptions}
                value={siteType}
                onChange={setSiteType}
                placeholder="Select a site type"
                searchPlaceholder="Search site types…"
                emptyMessage="No site types"
              />
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-ink" aria-hidden="true" />
                  <span className="text-sm font-medium text-on-surface">
                    Location<span className="ml-0.5 text-error">*</span>
                  </span>
                </div>
                <div className="rounded-xl border border-grey-200 bg-white p-3">
                  <LocationPicker
                    value={mapsLink}
                    onChange={setMapsLink}
                    linkFieldShown={false}
                    onCoordsChange={(coords) => {
                      setLat(coords.lat);
                      setLng(coords.lng);
                    }}
                  />
                </div>
                <TextField
                  label="Street address"
                  name="cwo-address"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  label="Site contact name"
                  name="cwo-contact-name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
                <TextField
                  label="Site contact number"
                  name="cwo-contact-number"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <TextField
            label="Your PO number (optional)"
            name="cwo-po"
            value={poId}
            onChange={(e) => setPoId(e.target.value)}
            placeholder="e.g. 4500012345"
          />
          <p className="text-xs text-grey-500">Leave blank and we&apos;ll assign a reference number.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="cwo-desc" className="text-sm font-medium text-on-surface">
            What needs to be done<span className="ml-0.5 text-error">*</span>
          </label>
          <textarea
            id="cwo-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={4000}
            placeholder="e.g. Pressure-wash the loading dock and clear the gutters."
            className="rounded-xl border border-grey-300 bg-white px-3.5 py-2.5 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-on-surface">Photos (optional)</span>
          <div className="flex flex-wrap gap-2">
            {previews.map((p, i) => (
              <div key={p.url} className="relative h-20 w-20 overflow-hidden rounded-lg border border-grey-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.file.name} className="h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label="Remove photo"
                  disabled={pending}
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </div>
            ))}
            {files.length < MAX_PHOTOS && (
              <button
                type="button"
                disabled={pending}
                onClick={() => fileRef.current?.click()}
                className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-grey-300 text-xs text-grey-500 transition-colors hover:border-ink hover:text-ink"
              >
                <Upload size={16} aria-hidden="true" />
                Add
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const list = e.target.files;
                if (list) setFiles((prev) => [...prev, ...Array.from(list)].slice(0, MAX_PHOTOS));
                e.currentTarget.value = "";
              }}
            />
          </div>
        </div>

        <TextField
          label="Start date (optional)"
          name="cwo-start-date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cwo-start-note" className="text-sm font-medium text-on-surface">
            Start date notes (optional)
          </label>
          <textarea
            id="cwo-start-note"
            value={startNote}
            onChange={(e) => setStartNote(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="e.g. Every Monday for 4 weeks, or any weekday after 6 pm."
            className="rounded-xl border border-grey-300 bg-white px-3.5 py-2.5 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-on-surface">Allowed work window (optional)</span>
          <div className="rounded-2xl border border-grey-200 bg-grey-100/40 p-3">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <TimeField label="Start" value={startTime} onChange={setStartTime} />
              </div>
              <ArrowRight size={16} className="mb-3 shrink-0 text-grey-400" aria-hidden="true" />
              <div className="flex-1">
                <TimeField label="End (optional)" value={endTime} onChange={setEndTime} />
              </div>
            </div>
            {info && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-ink">{info.duration}</span>
                {info.overnight && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-600">
                    <MoonStar size={12} aria-hidden="true" />
                    Overnight — ends next day
                  </span>
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-grey-500">When our team may work on site. Set an end earlier than the start for overnight work.</p>
        </div>

        {(formError || create.isError) && (
          <p role="alert" className="text-sm font-medium text-error">
            {formError ?? getErrorMessage(create.error)}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={close}
            className="rounded-full border border-grey-300 px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={pending}
            className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Sending…" : "Send request"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
