"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { PillButton } from "@/components/shared/PillButton";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useCreateSupplier, useUpdateSupplier } from "@/features/inventory/hooks/useSuppliers";
import {
  SupplierFormSchema,
  type SupplierFormInput,
  type Supplier,
} from "@/features/inventory/schemas/inventory.schema";

interface SupplierFormModalProps {
  open: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
}

const EMPTY: SupplierFormInput = { name: "", email: "", phone: "", address: "" };

export function SupplierFormModal({ open, onClose, supplier }: SupplierFormModalProps) {
  const isEdit = !!supplier;
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const active = isEdit ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormInput>({ resolver: zodResolver(SupplierFormSchema), defaultValues: EMPTY });

  useEffect(() => {
    if (!open) return;
    reset(
      supplier
        ? {
            name: supplier.name,
            email: supplier.email ?? "",
            phone: supplier.phone ?? "",
            address: supplier.address ?? "",
          }
        : EMPTY,
    );
    createMutation.reset();
    updateMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, supplier]);

  function onSubmit(values: SupplierFormInput) {
    const payload = {
      name: values.name,
      email: values.email?.trim() || undefined,
      phone: values.phone?.trim() || undefined,
      address: values.address?.trim() || undefined,
    };
    if (isEdit && supplier) {
      updateMutation.mutate({ id: supplier.id, input: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit supplier" : "Add supplier"}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <TextField label="Supplier name" required error={errors.name?.message} {...register("name")} />
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Email" type="email" placeholder="Optional" error={errors.email?.message} {...register("email")} />
          <TextField label="Phone" placeholder="Optional" error={errors.phone?.message} {...register("phone")} />
        </div>
        <TextField label="Address" placeholder="Optional" error={errors.address?.message} {...register("address")} />

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
            {active.isPending ? "Saving…" : isEdit ? "Save changes" : "Add supplier"}
          </PillButton>
        </div>
      </form>
    </Modal>
  );
}
