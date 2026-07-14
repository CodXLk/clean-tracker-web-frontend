"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { PillButton } from "@/components/shared/PillButton";
import { CreateUserSchema, type CreateUserInput } from "@/features/users/schemas/user.schema";
import { useCreateUser, getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useRoles } from "@/features/users/hooks/useRoles";

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateUserModal({ open, onClose }: CreateUserModalProps) {
  const createUser = useCreateUser();
  const rolesQuery = useRoles();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
    },
  });

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
        <div className="flex flex-col gap-1.5">
          <label htmlFor="role" className="text-sm font-medium text-on-surface">
            Role<span className="ml-0.5 text-error">*</span>
          </label>
          <select
            id="role"
            className="h-11 w-full rounded-xl border border-grey-300 bg-white px-3.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            defaultValue=""
            disabled={rolesQuery.isLoading}
            {...register("role")}
          >
            <option value="" disabled>
              {rolesQuery.isLoading ? "Loading roles…" : "Select a role"}
            </option>
            {rolesQuery.data?.map((role) => (
              <option key={role.name} value={role.name}>
                {role.label}
              </option>
            ))}
          </select>
          {rolesQuery.isError && (
            <p className="text-xs font-medium text-error">Failed to load roles. Please try again.</p>
          )}
          {errors.role?.message && <p className="text-xs font-medium text-error">{errors.role.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="First name" required error={errors.firstName?.message} {...register("firstName")} />
          <TextField label="Last name" error={errors.lastName?.message} {...register("lastName")} />
        </div>
        <TextField label="Email" type="email" required error={errors.email?.message} {...register("email")} />
        <TextField label="Phone number" error={errors.phoneNumber?.message} {...register("phoneNumber")} />

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
