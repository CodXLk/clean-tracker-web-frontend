"use client";

import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { PhoneNumberField } from "@/components/shared/PhoneNumberField";
import { PillButton } from "@/components/shared/PillButton";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { SearchableSelect, type SelectOption } from "./SearchableSelect";
import {
  ClientFormSchema,
  type Client,
  type ClientFormInput,
} from "@/features/user-management/schemas/client.schema";
import { useClientCompanies } from "@/features/user-management/hooks/useClientCompanies";
import { useCreateClient, useUpdateClient } from "@/features/user-management/hooks/useClients";

interface ClientFormModalProps {
  open: boolean;
  onClose: () => void;
  client?: Client | null;
}

const EMPTY: ClientFormInput = { clientCompanyId: "", name: "", contactNumber: "", email: "" };

export function ClientFormModal({ open, onClose, client }: ClientFormModalProps) {
  const isEdit = !!client;
  const companiesQuery = useClientCompanies();
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const active = isEdit ? updateMutation : createMutation;

  const companyOptions: SelectOption[] = useMemo(
    () => (companiesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name, sublabel: c.email ?? undefined })),
    [companiesQuery.data],
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ClientFormInput>({
    resolver: zodResolver(ClientFormSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      client
        ? {
            clientCompanyId: client.clientCompanyId,
            name: client.name,
            contactNumber: client.contactNumber ?? "",
            email: client.email ?? "",
          }
        : EMPTY,
    );
    createMutation.reset();
    updateMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client]);

  function onSubmit(values: ClientFormInput) {
    if (isEdit && client) {
      updateMutation.mutate({ id: client.id, input: values }, { onSuccess: onClose });
    } else {
      createMutation.mutate(values, { onSuccess: onClose });
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit client" : "Add a client"}
      description={
        isEdit
          ? "Update this client's details."
          : "Select a client-company, then enter the client's details. They will receive an email with a temporary password and a setup link."
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Controller
          control={control}
          name="clientCompanyId"
          render={({ field }) => (
            <SearchableSelect
              label="Client-company"
              required
              options={companyOptions}
              value={field.value || null}
              onChange={field.onChange}
              loading={companiesQuery.isLoading}
              placeholder="Select a client-company"
              searchPlaceholder="Search client-companies…"
              emptyMessage="No client-companies found. Create one first."
              error={errors.clientCompanyId?.message}
            />
          )}
        />

        <TextField label="Client name" required error={errors.name?.message} {...register("name")} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Contact number" error={errors.contactNumber?.message} {...register("contactNumber")} />
          <TextField
            label="Email address"
            type="email"
            required
            error={errors.email?.message}
            {...register("email")}
          />
        </div>

        {active.isError && (
          <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
            {getErrorMessage(active.error)}
          </p>
        )}

        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-full border border-grey-300 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100"
          >
            Cancel
          </button>
          <PillButton type="submit" variant="teal" className="h-11 flex-1" disabled={active.isPending}>
            {active.isPending ? "Saving…" : isEdit ? "Save changes" : "Create client"}
          </PillButton>
        </div>
      </form>
    </Modal>
  );
}
