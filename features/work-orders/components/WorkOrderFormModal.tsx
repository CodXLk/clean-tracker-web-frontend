"use client";

import { useMemo, useRef, useState } from "react";
import { X, Upload } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { SearchableSelect, type SelectOption } from "@/features/user-management/components/SearchableSelect";
import { useSites } from "@/features/user-management/hooks/useSites";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
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
  const [description, setDescription] = useState(workOrder?.description ?? "");
  const [numberOfCleaners, setNumberOfCleaners] = useState(workOrder?.numberOfCleaners ?? 1);
  const [numberOfSupervisors, setNumberOfSupervisors] = useState(workOrder?.numberOfSupervisors ?? 1);
  const [priceType, setPriceType] = useState<WorkOrderPriceType>(workOrder?.priceType ?? "TOTAL_AMOUNT");
  const [priceAmount, setPriceAmount] = useState<string>(
    workOrder?.priceAmount != null ? String(workOrder.priceAmount) : "",
  );
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pending = isEdit ? update.isPending : create.isPending;
  const mutationError = isEdit ? update.error : create.error;
  const isError = isEdit ? update.isError : create.isError;

  const sitesQuery = useSites();
  const siteOptions: SelectOption[] = useMemo(
    () => (sitesQuery.data ?? []).map((s) => ({ value: s.id, label: s.name })),
    [sitesQuery.data],
  );

  const previews = useMemo(() => pendingFiles.map((f) => ({ file: f, url: URL.createObjectURL(f) })), [pendingFiles]);

  function handleClose() {
    if (pending || uploadPhotos.isPending) return;
    setFormError(null);
    create.reset();
    update.reset();
    setPendingFiles([]);
    onClose();
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    setPendingFiles((prev) => [...prev, ...Array.from(files)]);
  }

  function validate(): string | null {
    if (!poId.trim()) return "Enter the PO ID.";
    if (!siteId) return "Select a site.";
    if (priceAmount.trim() && !(Number(priceAmount) > 0)) return "Enter a valid price greater than zero.";
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
    const pricePayload = {
      priceType: parsedPrice != null ? priceType : undefined,
      priceAmount: parsedPrice,
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

    create.mutate(
      {
        poId: trimmedPo,
        siteId,
        description: description.trim() || undefined,
        numberOfCleaners,
        numberOfSupervisors,
        ...pricePayload,
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="PO ID"
            name="wo-po"
            required
            value={poId}
            onChange={(e) => setPoId(e.target.value)}
            placeholder="e.g. PO-2025-0142"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-on-surface">
              Site<span className="ml-0.5 text-error">*</span>
            </label>
            <SearchableSelect
              options={siteOptions}
              value={siteId || null}
              onChange={setSiteId}
              disabled={isEdit}
              loading={sitesQuery.isLoading}
              placeholder="Select site"
              searchPlaceholder="Search sites…"
            />
          </div>
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

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-on-surface">Price</span>
          <div className="flex flex-wrap gap-2">
            {WORK_ORDER_PRICE_TYPE_VALUES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPriceType(value)}
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
          <TextField
            label={priceType === "RATE_PER_HOUR" ? "Rate per hour (AUD)" : "Total amount (AUD)"}
            name="wo-price"
            type="number"
            min={0}
            step="0.01"
            value={priceAmount}
            onChange={(e) => setPriceAmount(e.target.value)}
            placeholder="e.g. 250.00"
          />
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
