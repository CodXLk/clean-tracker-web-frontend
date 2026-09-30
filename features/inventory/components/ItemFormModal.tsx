"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { PillButton } from "@/components/shared/PillButton";
import { SearchableSelect } from "@/features/user-management/components/SearchableSelect";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  useCreateItem,
  useUpdateItem,
  useUploadItemPhoto,
  useDeleteItemPhoto,
  useUploadItemSds,
  useDeleteItemSds,
} from "@/features/inventory/hooks/useInventory";
import { useSuppliers } from "@/features/inventory/hooks/useSuppliers";
import {
  ItemFormSchema,
  CATEGORY_LABELS,
  UNIT_OPTIONS,
  type ItemFormInput,
  type InventoryCategory,
  type InventoryItem,
} from "@/features/inventory/schemas/inventory.schema";

interface ItemFormModalProps {
  open: boolean;
  onClose: () => void;
  item?: InventoryItem | null;
}

const EMPTY: ItemFormInput = {
  name: "",
  itemCode: "",
  category: "CONSUMABLE",
  unit: "pcs",
  unitPrice: 0,
  costPrice: undefined,
  minStock: undefined,
  supplierId: "",
  openingStock: undefined,
};

function buildPayload(values: ItemFormInput) {
  return {
    name: values.name,
    itemCode: values.itemCode?.trim() || undefined,
    category: values.category,
    unit: values.unit,
    unitPrice: values.unitPrice,
    costPrice: values.costPrice,
    minStock: values.minStock,
    supplierId: values.supplierId || undefined,
  };
}

export function ItemFormModal({ open, onClose, item }: ItemFormModalProps) {
  const isEdit = !!item;
  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem();
  const uploadPhoto = useUploadItemPhoto();
  const deletePhoto = useDeleteItemPhoto();
  const uploadSds = useUploadItemSds();
  const deleteSds = useDeleteItemSds();
  const active = isEdit ? updateMutation : createMutation;
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers(true);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [sdsFile, setSdsFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [removeSds, setRemoveSds] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ItemFormInput>({ resolver: zodResolver(ItemFormSchema), defaultValues: EMPTY });

  const category = watch("category");
  const isChemical = category === "CHEMICAL";

  useEffect(() => {
    if (!open) return;
    setPhotoFile(null);
    setSdsFile(null);
    setRemovePhoto(false);
    setRemoveSds(false);
    reset(
      item
        ? {
            name: item.name,
            itemCode: item.itemCode ?? "",
            category: item.category,
            unit: item.unit,
            unitPrice: item.unitPrice,
            costPrice: item.costPrice ?? undefined,
            minStock: item.minStock ?? undefined,
            supplierId: item.supplierId ?? "",
          }
        : EMPTY,
    );
    createMutation.reset();
    updateMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  async function applyMedia(itemId: string) {
    setMediaBusy(true);
    try {
      if (removePhoto && !photoFile) await deletePhoto.mutateAsync(itemId);
      if (photoFile) await uploadPhoto.mutateAsync({ id: itemId, file: photoFile });
      if (removeSds && !sdsFile) await deleteSds.mutateAsync(itemId);
      if (sdsFile && category === "CHEMICAL") await uploadSds.mutateAsync({ id: itemId, file: sdsFile });
    } finally {
      setMediaBusy(false);
    }
  }

  function onSubmit(values: ItemFormInput) {
    const payload = buildPayload(values);
    if (isEdit && item) {
      updateMutation.mutate(
        { id: item.id, input: payload },
        {
          onSuccess: async () => {
            await applyMedia(item.id);
            onClose();
          },
        },
      );
    } else {
      createMutation.mutate(
        { ...payload, openingStock: values.openingStock } as ItemFormInput,
        {
          onSuccess: async (created) => {
            await applyMedia(created.id);
            onClose();
          },
        },
      );
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit item" : "Add item"}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Item name" required error={errors.name?.message} {...register("name")} />
          <TextField label="Item code" placeholder="Optional" error={errors.itemCode?.message} {...register("itemCode")} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <SearchableSelect
                label="Category"
                required
                options={(Object.keys(CATEGORY_LABELS) as InventoryCategory[]).map((c) => ({
                  value: c,
                  label: CATEGORY_LABELS[c],
                }))}
                value={field.value || null}
                onChange={field.onChange}
                error={errors.category?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="unit"
            render={({ field }) => {
              const options = UNIT_OPTIONS.some((u) => u.value === field.value)
                ? UNIT_OPTIONS
                : [{ value: field.value, label: field.value }, ...UNIT_OPTIONS];
              return (
                <SearchableSelect
                  label="Unit"
                  required
                  options={options}
                  value={field.value || null}
                  onChange={field.onChange}
                  error={errors.unit?.message}
                  placeholder="Select unit"
                />
              );
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="unitPrice"
            render={({ field }) => (
              <TextField
                label="Unit price"
                type="number"
                step="0.01"
                min="0"
                required
                error={errors.unitPrice?.message}
                value={field.value}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            )}
          />
          {!isEdit && (
            <Controller
              control={control}
              name="openingStock"
              render={({ field }) => (
                <TextField
                  label="Opening stock"
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="0"
                  error={errors.openingStock?.message}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                />
              )}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="costPrice"
            render={({ field }) => (
              <TextField
                label="Cost price"
                type="number"
                step="0.01"
                min="0"
                placeholder="Optional"
                error={errors.costPrice?.message}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
              />
            )}
          />
          <Controller
            control={control}
            name="minStock"
            render={({ field }) => (
              <TextField
                label="Reorder level"
                type="number"
                step="0.001"
                min="0"
                placeholder="Alert below this"
                error={errors.minStock?.message}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
              />
            )}
          />
        </div>

        <Controller
          control={control}
          name="supplierId"
          render={({ field }) => (
            <SearchableSelect
              label="Supplier"
              required
              options={(suppliers ?? []).map((s) => ({ value: s.id, label: s.name }))}
              value={field.value || null}
              onChange={(v) => field.onChange(v ?? "")}
              loading={suppliersLoading}
              placeholder="Select a supplier"
              error={errors.supplierId?.message}
            />
          )}
        />

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-on-surface">Item photo (optional)</label>
          {isEdit && item?.hasPhoto && !removePhoto && !photoFile && (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api${ENDPOINTS.inventory.itemPhoto(item.id)}`}
                alt={item.name}
                className="h-16 w-16 rounded-lg border border-grey-200 object-cover"
              />
              <button
                type="button"
                onClick={() => setRemovePhoto(true)}
                className="text-sm font-semibold text-error hover:underline"
              >
                Remove photo
              </button>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              setPhotoFile(e.target.files?.[0] ?? null);
              setRemovePhoto(false);
            }}
            className="text-sm text-on-surface-variant file:mr-3 file:rounded-full file:border-0 file:bg-grey-100 file:px-4 file:py-2 file:text-sm file:font-semibold"
          />
        </div>

        {isChemical && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-on-surface">Safety Data Sheet (PDF, optional)</label>
            {isEdit && item?.hasSds && !removeSds && !sdsFile && (
              <div className="flex items-center gap-3">
                <a
                  href={`/api${ENDPOINTS.inventory.itemSds(item.id)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-teal hover:underline"
                >
                  {item.sdsFilename || "View current SDS"}
                </a>
                <button
                  type="button"
                  onClick={() => setRemoveSds(true)}
                  className="text-sm font-semibold text-error hover:underline"
                >
                  Remove
                </button>
              </div>
            )}
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => {
                setSdsFile(e.target.files?.[0] ?? null);
                setRemoveSds(false);
              }}
              className="text-sm text-on-surface-variant file:mr-3 file:rounded-full file:border-0 file:bg-grey-100 file:px-4 file:py-2 file:text-sm file:font-semibold"
            />
          </div>
        )}

        {active.isError && (
          <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
            {getErrorMessage(active.error)}
          </p>
        )}

        <div className="mt-1 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-full border border-grey-300 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100"
          >
            Cancel
          </button>
          <PillButton type="submit" variant="teal" className="h-11 flex-1" disabled={active.isPending || mediaBusy}>
            {active.isPending || mediaBusy ? "Saving…" : isEdit ? "Save changes" : "Add item"}
          </PillButton>
        </div>
      </form>
    </Modal>
  );
}
