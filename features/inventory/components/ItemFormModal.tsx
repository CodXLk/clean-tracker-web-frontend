"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { PillButton } from "@/components/shared/PillButton";
import { SearchableSelect } from "@/features/user-management/components/SearchableSelect";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useCreateItem, useUpdateItem } from "@/features/inventory/hooks/useInventory";
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
  category: "CONSUMABLE",
  unit: "pcs",
  unitPrice: 0,
  openingStock: undefined,
};

export function ItemFormModal({ open, onClose, item }: ItemFormModalProps) {
  const isEdit = !!item;
  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem();
  const active = isEdit ? updateMutation : createMutation;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ItemFormInput>({ resolver: zodResolver(ItemFormSchema), defaultValues: EMPTY });

  useEffect(() => {
    if (!open) return;
    reset(
      item
        ? { name: item.name, category: item.category, unit: item.unit, unitPrice: item.unitPrice }
        : EMPTY,
    );
    createMutation.reset();
    updateMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  function onSubmit(values: ItemFormInput) {
    if (isEdit && item) {
      updateMutation.mutate(
        { id: item.id, input: { name: values.name, category: values.category, unit: values.unit, unitPrice: values.unitPrice } },
        { onSuccess: onClose },
      );
    } else {
      createMutation.mutate(values, { onSuccess: onClose });
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit item" : "Add item"}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <TextField label="Item name" required error={errors.name?.message} {...register("name")} />

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
          <PillButton type="submit" variant="teal" className="h-11 flex-1" disabled={active.isPending}>
            {active.isPending ? "Saving…" : isEdit ? "Save changes" : "Add item"}
          </PillButton>
        </div>
      </form>
    </Modal>
  );
}
