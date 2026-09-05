"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { PhoneNumberField } from "@/components/shared/PhoneNumberField";
import { PillButton } from "@/components/shared/PillButton";
import { UpdateUserSchema, type UpdateUserInput, type User, type Role } from "@/features/users/schemas/user.schema";
import { useUpdateUser, useUpdateUserRoles } from "@/features/users/hooks/useUserActions";
import { useRoles } from "@/features/users/hooks/useRoles";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

export function EditUserModal({ open, onClose, user }: EditUserModalProps) {
  const update = useUpdateUser();
  const updateRoles = useUpdateUserRoles();
  const rolesQuery = useRoles();
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(UpdateUserSchema),
    defaultValues: { firstName: "", lastName: "", phoneNumber: "", dateOfBirth: "" },
  });

  useEffect(() => {
    if (!open || !user) return;
    reset({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      phoneNumber: user.phoneNumber ?? "",
      dateOfBirth: (user.dateOfBirth ?? "").slice(0, 10),
    });
    // Sync the role checkboxes to the user being edited when the modal opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedRoles((user.roles?.length ? user.roles : [user.role]) as Role[]);
    update.reset();
    updateRoles.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  function close() {
    update.reset();
    updateRoles.reset();
    onClose();
  }

  function onSubmit(values: UpdateUserInput) {
    if (!user) return;
    // Drop an empty DOB so the backend doesn't try to parse "" as a date.
    const input: UpdateUserInput = { ...values, dateOfBirth: values.dateOfBirth || undefined };
    update.mutate({ id: user.id, input }, { onSuccess: close });
  }

  function toggleRole(role: Role, checked: boolean) {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (checked) next.add(role);
      else next.delete(role);
      return Array.from(next);
    });
  }

  function saveRoles() {
    if (!user || selectedRoles.length === 0) return;
    updateRoles.mutate({ id: user.id, roles: selectedRoles });
  }

  // Roles the assignable-roles endpoint doesn't offer (e.g. SUPER_ADMIN/CLIENT) but the user
  // already holds — kept visible and checked so saving never silently drops them.
  const optionNames = (rolesQuery.data ?? []).map((r) => r.name);
  const extraCurrentRoles = selectedRoles.filter((r) => !optionNames.includes(r));

  return (
    <Modal open={open} onClose={close} title="Edit details" description="Update the person's name, phone and date of birth.">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="First name" error={errors.firstName?.message} {...register("firstName")} />
          <TextField label="Last name" error={errors.lastName?.message} {...register("lastName")} />
        </div>
        <Controller
          control={control}
          name="phoneNumber"
          render={({ field }) => (
            <PhoneNumberField
              label="Phone number"
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              error={errors.phoneNumber?.message}
            />
          )}
        />
        <TextField label="Date of birth" type="date" error={errors.dateOfBirth?.message} {...register("dateOfBirth")} />

        {update.isError && (
          <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
            {getErrorMessage(update.error)}
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
          <PillButton type="submit" variant="teal" className="h-11 flex-1" disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save changes"}
          </PillButton>
        </div>
      </form>

      <div className="mt-6 border-t border-line pt-5">
        <h3 className="text-sm font-semibold text-on-surface">Roles</h3>
        <p className="mt-0.5 mb-3 text-xs text-body-2">
          Choose every role this person can operate as. They&apos;ll pick one to work as at sign-in.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(rolesQuery.data ?? []).map((role) => {
            const checked = selectedRoles.includes(role.name);
            return (
              <label
                key={role.name}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-grey-300 px-3.5 py-2.5 text-sm text-on-surface transition-colors hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-grey-300 text-primary focus:ring-primary/30"
                  checked={checked}
                  onChange={(e) => toggleRole(role.name, e.target.checked)}
                />
                {role.label}
              </label>
            );
          })}
        </div>
        {extraCurrentRoles.length > 0 && (
          <p className="mt-2 text-xs text-body-2">
            Also currently assigned: {extraCurrentRoles.join(", ")}
          </p>
        )}
        {selectedRoles.length === 0 && (
          <p className="mt-2 text-xs font-medium text-error">A user must keep at least one role.</p>
        )}
        {updateRoles.isError && (
          <p role="alert" className="mt-2 rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
            {getErrorMessage(updateRoles.error)}
          </p>
        )}
        {updateRoles.isSuccess && (
          <p className="mt-2 rounded-lg bg-success/10 px-3 py-2 text-sm font-medium text-success">
            Roles updated.
          </p>
        )}
        <div className="mt-3">
          <PillButton
            type="button"
            variant="teal"
            className="h-11"
            onClick={saveRoles}
            disabled={updateRoles.isPending || selectedRoles.length === 0}
          >
            {updateRoles.isPending ? "Updating roles…" : "Update roles"}
          </PillButton>
        </div>
      </div>
    </Modal>
  );
}
