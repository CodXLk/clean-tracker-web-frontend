"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { PillButton } from "@/components/shared/PillButton";
import {
  CreateCompanySchema,
  type CreateCompanyInput,
} from "@/features/companies/schemas/company.schema";
import { useCreateCompany } from "@/features/companies/hooks/useCompanies";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";

interface CreateCompanyModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateCompanyModal({ open, onClose }: CreateCompanyModalProps) {
  const createCompany = useCreateCompany();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCompanyInput>({
    resolver: zodResolver(CreateCompanySchema),
    defaultValues: { name: "", contactEmail: "", contactPhone: "", addressLine: "", city: "", state: "", postcode: "" },
  });

  function close() {
    reset();
    createCompany.reset();
    onClose();
  }

  function onSubmit(values: CreateCompanyInput) {
    createCompany.mutate(values, { onSuccess: close });
  }

  return (
    <Modal open={open} onClose={close} title="Add a client company" description="A business that engages Primeway for cleaning.">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <TextField label="Company name" required error={errors.name?.message} {...register("name")} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Contact email" type="email" error={errors.contactEmail?.message} {...register("contactEmail")} />
          <TextField label="Contact phone" error={errors.contactPhone?.message} {...register("contactPhone")} />
        </div>
        <TextField label="Address" error={errors.addressLine?.message} {...register("addressLine")} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField label="City" error={errors.city?.message} {...register("city")} />
          <TextField label="State" error={errors.state?.message} {...register("state")} />
          <TextField label="Postcode" error={errors.postcode?.message} {...register("postcode")} />
        </div>

        {createCompany.isError && (
          <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
            {getErrorMessage(createCompany.error)}
          </p>
        )}

        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={close}
            className="h-11 flex-1 rounded-full border border-grey-300 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100"
          >
            Cancel
          </button>
          <PillButton type="submit" variant="teal" className="h-11 flex-1" disabled={createCompany.isPending}>
            {createCompany.isPending ? "Saving…" : "Create company"}
          </PillButton>
        </div>
      </form>
    </Modal>
  );
}
