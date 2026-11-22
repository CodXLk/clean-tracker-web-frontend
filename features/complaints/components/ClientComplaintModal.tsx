"use client";

import { useMemo, useRef, useState } from "react";
import { Camera, ImagePlus, ShieldAlert, X } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { SearchableSelect, type SelectOption } from "@/features/user-management/components/SearchableSelect";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useClientSiteOptions, useCreateClientComplaint } from "@/features/complaints/hooks/useClientComplaints";
import type { Complaint } from "@/features/complaints/schemas/complaint.schema";

const MAX_PHOTOS = 10;
const ALL = "";

interface ClientComplaintModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (complaint: Complaint) => void;
}

/**
 * Client portal: raise a complaint about one of their sites. Floor and area are optional (a single-floor
 * site needs no floor choice; no area means the whole floor/site). Photos come from the camera or gallery.
 */
export function ClientComplaintModal({ open, onClose, onCreated }: ClientComplaintModalProps) {
  const sitesQuery = useClientSiteOptions(open);
  const create = useCreateClientComplaint();

  const [siteId, setSiteId] = useState("");
  const [floorId, setFloorId] = useState(ALL);
  const [areaId, setAreaId] = useState(ALL);
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const sites = useMemo(() => sitesQuery.data ?? [], [sitesQuery.data]);
  const site = sites.find((s) => s.id === siteId) ?? null;
  const floors = site?.floors ?? [];
  const singleFloor = floors.length === 1 ? floors[0]! : null;
  const floor = singleFloor ?? floors.find((f) => f.id === floorId) ?? null;
  const areas = floor?.areas ?? [];

  const siteOptions: SelectOption[] = useMemo(() => sites.map((s) => ({ value: s.id, label: s.name })), [sites]);
  const floorOptions: SelectOption[] = useMemo(
    () => [{ value: ALL, label: "All floors" }, ...floors.map((f) => ({ value: f.id, label: f.name }))],
    [floors],
  );
  const areaOptions: SelectOption[] = useMemo(
    () => [{ value: ALL, label: "All areas" }, ...areas.map((a) => ({ value: a.id, label: a.name }))],
    [areas],
  );
  const previews = useMemo(() => photos.map((f) => ({ file: f, url: URL.createObjectURL(f) })), [photos]);

  function reset() {
    setSiteId("");
    setFloorId(ALL);
    setAreaId(ALL);
    setDescription("");
    setPhotos([]);
    setFormError(null);
    create.reset();
  }

  function close() {
    if (create.isPending) return;
    reset();
    onClose();
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const images = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setPhotos((prev) => [...prev, ...images].slice(0, MAX_PHOTOS));
  }

  function submit() {
    if (create.isPending) return;
    if (!siteId) return setFormError("Select the site.");
    if (!description.trim()) return setFormError("Describe the problem.");
    setFormError(null);
    create.mutate(
      {
        siteId,
        floorId: floor?.id ?? undefined,
        areaId: areaId || undefined,
        description,
        photos,
      },
      {
        onSuccess: (complaint) => {
          onCreated?.(complaint);
          reset();
          onClose();
        },
      },
    );
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="New complaint"
      description="Tell us what needs attention at your site."
      maxWidthClassName="max-w-lg"
    >
      <div className="flex flex-col gap-4">
        <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
          <ShieldAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          Your complaint is treated as high priority: our cleaners handle it first on their next visit, and our
          supervisors check it before it&apos;s resolved.
        </p>

        <SearchableSelect
          label="Site"
          required
          options={siteOptions}
          value={siteId || null}
          onChange={(id) => {
            setSiteId(id);
            setFloorId(ALL);
            setAreaId(ALL);
          }}
          loading={sitesQuery.isLoading}
          placeholder="Select your site"
          searchPlaceholder="Search by site name…"
          emptyMessage="No sites found."
        />

        {site && floors.length > 1 && (
          <SearchableSelect
            label="Floor (optional)"
            options={floorOptions}
            value={floorId}
            onChange={(id) => {
              setFloorId(id);
              setAreaId(ALL);
            }}
            placeholder="All floors"
            searchPlaceholder="Search floors…"
            emptyMessage="No floors"
          />
        )}

        {floor && areas.length > 0 && (
          <SearchableSelect
            label="Area (optional)"
            options={areaOptions}
            value={areaId}
            onChange={setAreaId}
            placeholder="All areas"
            searchPlaceholder="Search areas…"
            emptyMessage="No areas"
          />
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="client-complaint-desc" className="text-sm font-medium text-on-surface">
            What&apos;s the problem?<span className="ml-0.5 text-error">*</span>
          </label>
          <textarea
            id="client-complaint-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={2048}
            placeholder="e.g. The kitchen bins on level 2 weren't emptied this morning."
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
                  onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <>
                <button
                  type="button"
                  onClick={() => cameraRef.current?.click()}
                  className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-grey-300 text-xs text-grey-500 transition-colors hover:border-ink hover:text-ink"
                >
                  <Camera size={16} aria-hidden="true" />
                  Camera
                </button>
                <button
                  type="button"
                  onClick={() => galleryRef.current?.click()}
                  className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-grey-300 text-xs text-grey-500 transition-colors hover:border-ink hover:text-ink"
                >
                  <ImagePlus size={16} aria-hidden="true" />
                  Gallery
                </button>
              </>
            )}
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.currentTarget.value = "";
              }}
            />
            <input
              ref={galleryRef}
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
            onClick={submit}
            disabled={create.isPending}
            className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {create.isPending ? "Sending…" : "Submit complaint"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
