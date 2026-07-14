"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { PhoneNumberField } from "@/components/shared/PhoneNumberField";
import { PillButton } from "@/components/shared/PillButton";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import {
  ClientCompanyFormSchema,
  type ClientCompany,
  type ClientCompanyFormInput,
} from "@/features/user-management/schemas/clientCompany.schema";
import {
  useCreateClientCompany,
  useUpdateClientCompany,
} from "@/features/user-management/hooks/useClientCompanies";

interface ClientCompanyFormModalProps {
  open: boolean;
  onClose: () => void;
  company?: ClientCompany | null;
}

const EMPTY: ClientCompanyFormInput = { name: "", contactNumber: "", email: "" };

export function ClientCompanyFormModal({ open, onClose, company }: ClientCompanyFormModalProps) {
  const isEdit = !!company;
  const createMutation = useCreateClientCompany();
  const updateMutation = useUpdateClientCompany();
  const active = isEdit ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ClientCompanyFormInput>({
    resolver: zodResolver(ClientCompanyFormSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      company
        ? {
            name: company.name,
            contactNumber: company.contactNumber ?? "",
            email: company.email ?? "",
          }
        : EMPTY,
    );
    createMutation.reset();
    updateMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, company]);

  function close() {
    onClose();
  }

  function onSubmit(values: ClientCompanyFormInput) {
    if (isEdit && company) {
      updateMutation.mutate({ id: company.id, input: values }, { onSuccess: close });
    } else {
      createMutation.mutate(values, { onSuccess: close });
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={isEdit ? "Edit client-company" : "Add a client-company"}
      description={isEdit ? "Update this client-company's details." : "Create a new client-company record."}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <TextField
          label="Client-company name"
          required
          error={errors.name?.message}
          {...register("name")}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <TextField label="Email address" type="email" error={errors.email?.message} {...register("email")} />
        </div>

        {active.isError && (
          <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
            {getErrorMessage(active.error)}
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
          <PillButton type="submit" variant="teal" className="h-11 flex-1" disabled={active.isPending}>
            {active.isPending ? "Saving…" : isEdit ? "Save changes" : "Create client-company"}
          </PillButton>
        </div>
      </form>
    </Modal>
  );
}
