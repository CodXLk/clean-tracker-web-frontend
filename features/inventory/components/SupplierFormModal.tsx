"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { PillButton } from "@/components/shared/PillButton";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useCreateSupplier, useUpdateSupplier } from "@/features/inventory/hooks/useSuppliers";
import { useSites } from "@/features/user-management/hooks/useSites";
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

const EMPTY: SupplierFormInput = {
  name: "",
  email: "",
  phone: "",
  address: "",
  clientSelfSupplying: false,
  siteId: "",
};

export function SupplierFormModal({ open, onClose, supplier }: SupplierFormModalProps) {
  const isEdit = !!supplier;
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const active = isEdit ? updateMutation : createMutation;
  const sitesQuery = useSites();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SupplierFormInput>({ resolver: zodResolver(SupplierFormSchema), defaultValues: EMPTY });

  const clientSelfSupplying = watch("clientSelfSupplying");

  useEffect(() => {
    if (!open) return;
    reset(
      supplier
        ? {
            name: supplier.name,
            email: supplier.email ?? "",
            phone: supplier.phone ?? "",
            address: supplier.address ?? "",
            clientSelfSupplying: supplier.clientSelfSupplying ?? false,
            siteId: supplier.siteId ?? "",
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
      clientSelfSupplying: values.clientSelfSupplying,
      siteId: values.clientSelfSupplying ? values.siteId || undefined : undefined,
    };
    if (values.clientSelfSupplying && !payload.siteId) {
      return;
    }
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

        <label className="flex items-start gap-2 rounded-xl border border-grey-200 bg-grey-50 px-3 py-2.5 text-sm text-on-surface">
          <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-grey-300 accent-primary" {...register("clientSelfSupplying")} />
          <span>
            <span className="font-medium">Client self-supplying</span>
            <span className="block text-xs text-grey-500">
              This is a hotel client that supplies items for its own site. Purchase orders become item
              requests the client confirms and dispatches directly to the site.
            </span>
          </span>
        </label>

        {clientSelfSupplying && (
          <div className="flex flex-col gap-1">
            <label htmlFor="supplier-site" className="text-sm font-medium text-on-surface">
              Hotel site <span className="text-danger">*</span>
            </label>
            <select
              id="supplier-site"
              className="rounded-xl border border-grey-300 bg-white px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              {...register("siteId")}
            >
              <option value="">Select a site…</option>
              {(sitesQuery.data ?? []).map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
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
          <PillButton type="submit" variant="teal" className="h-11 flex-1" disabled={active.isPending}>
            {active.isPending ? "Saving…" : isEdit ? "Save changes" : "Add supplier"}
          </PillButton>
        </div>
      </form>
    </Modal>
  );
}
