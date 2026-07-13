"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { PillButton } from "@/components/shared/PillButton";
import {
  CreateUserSchema,
  ROLE_LABELS,
  type CreateUserInput,
  type Role,
} from "@/features/users/schemas/user.schema";
import { useCreateUser, getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useCompanies } from "@/features/companies/hooks/useCompanies";

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  allowedRoles: Role[];
}

export function CreateUserModal({ open, onClose, allowedRoles }: CreateUserModalProps) {
  const createUser = useCreateUser();
  const companiesQuery = useCompanies();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      role: allowedRoles[0],
      companyId: undefined,
    },
  });

  const selectedRole = watch("role");

  function close() {
    reset();
    createUser.reset();
    onClose();
  }

  function onSubmit(values: CreateUserInput) {
    createUser.mutate(values, { onSuccess: close });
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Invite a user"
      description="They will receive an email with a temporary password and a setup link."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="First name" required error={errors.firstName?.message} {...register("firstName")} />
          <TextField label="Last name" error={errors.lastName?.message} {...register("lastName")} />
        </div>
        <TextField label="Email" type="email" required error={errors.email?.message} {...register("email")} />
        <TextField label="Phone number" error={errors.phoneNumber?.message} {...register("phoneNumber")} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="role" className="text-sm font-medium text-on-surface">
            Role<span className="ml-0.5 text-error">*</span>
          </label>
          <select
            id="role"
            className="h-11 w-full rounded-xl border border-grey-300 bg-white px-3.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            {...register("role")}
          >
            {allowedRoles.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
          {errors.role?.message && <p className="text-xs font-medium text-error">{errors.role.message}</p>}
        </div>

        {selectedRole === "CLIENT" && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="companyId" className="text-sm font-medium text-on-surface">
              Client company<span className="ml-0.5 text-error">*</span>
            </label>
            <select
              id="companyId"
              className="h-11 w-full rounded-xl border border-grey-300 bg-white px-3.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              defaultValue=""
              {...register("companyId")}
            >
              <option value="" disabled>
                {companiesQuery.isLoading ? "Loading companies…" : "Select a company"}
              </option>
              {companiesQuery.data?.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            {errors.companyId?.message && (
              <p className="text-xs font-medium text-error">{errors.companyId.message}</p>
            )}
            {companiesQuery.data?.length === 0 && (
              <p className="text-xs text-grey-500">No client companies yet — create one first.</p>
            )}
          </div>
        )}

        {createUser.isError && (
          <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
            {getErrorMessage(createUser.error)}
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
          <PillButton type="submit" variant="teal" className="h-11 flex-1" disabled={createUser.isPending}>
            {createUser.isPending ? "Inviting…" : "Send invite"}
          </PillButton>
        </div>
      </form>
    </Modal>
  );
}
