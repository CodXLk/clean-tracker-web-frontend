"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PanelOrModal } from "@/components/shared/PanelOrModal";
import { TextField } from "@/components/shared/TextField";
import { PhoneNumberField } from "@/components/shared/PhoneNumberField";
import { PillButton } from "@/components/shared/PillButton";
import {
  CreateUserSchema,
  ROLE_LABELS,
  type CreateUserInput,
  type Role,
} from "@/features/users/schemas/user.schema";
import { useCreateUser, getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useUploadUserPhoto } from "@/features/users/hooks/useProfilePhoto";
import { useRoles } from "@/features/users/hooks/useRoles";
import { AvatarUploadField } from "./AvatarUploadField";

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  /** When set, the role is locked to this value and the role selector is hidden —
   *  used by Cleaner Management to always create CLEANER accounts. */
  fixedRole?: Role;
  /** Role names to omit from the checkboxes when `fixedRole` is not set (e.g. hide a role
   *  the current context should never assign). */
  excludeRoleNames?: Role[];
  /** When set, only these role names are offered (whitelist) — typically the roles the current
   *  user is permitted to create. Combined with `excludeRoleNames`. */
  allowedRoleNames?: Role[];
  embedded?: boolean;
}

export function CreateUserModal({ open, onClose, fixedRole, excludeRoleNames, allowedRoleNames, embedded }: CreateUserModalProps) {
  const createUser = useCreateUser();
  const uploadPhoto = useUploadUserPhoto();
  const rolesQuery = useRoles();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const roleOptions = (rolesQuery.data ?? [])
    .filter((role) => !excludeRoleNames?.includes(role.name))
    .filter((role) => !allowedRoleNames || allowedRoleNames.includes(role.name));

  const roleLabel = fixedRole ? ROLE_LABELS[fixedRole] : null;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      dateOfBirth: "",
      roles: fixedRole ? [fixedRole] : [],
    },
  });

  function close() {
    reset();
    setPhotoFile(null);
    createUser.reset();
    uploadPhoto.reset();
    onClose();
  }

  async function onSubmit(values: CreateUserInput) {
    let created;
    try {
      created = await createUser.mutateAsync(values);
    } catch {
      return; // surfaced via createUser.error
    }
    if (photoFile) {
      // The photo is uploaded once the account exists; a failure here shouldn't lose the account.
      try {
        await uploadPhoto.mutateAsync({ userId: created.id, file: photoFile });
      } catch {
        return; // surfaced via uploadPhoto.error; keep the modal open so the user can retry
      }
    }
    close();
  }

  const busy = createUser.isPending || uploadPhoto.isPending;

  return (
    <PanelOrModal
      embedded={embedded}
      open={open}
      onClose={close}
      title={roleLabel ? `Add a new ${roleLabel}` : "Invite a user"}
      description={
        roleLabel
          ? `They will receive an email with a temporary password and a setup link to join as ${roleLabel}.`
          : "They will receive an email with a temporary password and a setup link."
      }
      embeddedMaxWidthClassName="w-full"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        {!fixedRole && (
          <Controller
            control={control}
            name="roles"
            render={({ field }) => (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 text-sm font-medium text-on-surface">
                  Roles<span className="ml-0.5 text-error">*</span>
                </legend>
                <p className="-mt-1 mb-1 text-xs text-body-2">Assign one or more roles this person can operate as.</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {roleOptions.map((role) => {
                    const checked = (field.value ?? []).includes(role.name);
                    return (
                      <label
                        key={role.name}
                        className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-grey-300 px-3.5 py-2.5 text-sm text-on-surface transition-colors hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-grey-300 text-primary focus:ring-primary/30"
                          value={role.name}
                          checked={checked}
                          onChange={(e) => {
                            const next = new Set(field.value ?? []);
                            if (e.target.checked) next.add(role.name);
                            else next.delete(role.name);
                            field.onChange(Array.from(next));
                          }}
                        />
                        {role.label}
                      </label>
                    );
                  })}
                </div>
                {rolesQuery.isLoading && <p className="text-xs text-body-2">Loading roles…</p>}
                {rolesQuery.isError && (
                  <p className="text-xs font-medium text-error">Failed to load roles. Please try again.</p>
                )}
                {errors.roles?.message && <p className="text-xs font-medium text-error">{errors.roles.message}</p>}
              </fieldset>
            )}
          />
        )}

        <div
          className={`flex flex-col gap-5 rounded-2xl border border-grey-200 bg-surface p-4 sm:p-5 ${
            embedded ? "lg:flex-row lg:items-start" : ""
          }`}
        >
          <div className="flex justify-center lg:justify-start">
            <AvatarUploadField
              file={photoFile}
              onSelect={setPhotoFile}
              onRemove={() => setPhotoFile(null)}
              busy={busy}
            />
          </div>
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="First name" required error={errors.firstName?.message} {...register("firstName")} />
            <TextField label="Last name" error={errors.lastName?.message} {...register("lastName")} />
            <div className="sm:col-span-2">
              <TextField label="Email" type="email" required error={errors.email?.message} {...register("email")} />
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
          </div>
        </div>

        {createUser.isError && (
          <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
            {getErrorMessage(createUser.error)}
          </p>
        )}
        {uploadPhoto.isError && (
          <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
            The account was created but the photo upload failed: {getErrorMessage(uploadPhoto.error)}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={close}
            className="h-11 flex-1 rounded-full border border-grey-300 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100 sm:max-w-[200px]"
          >
            Cancel
          </button>
          <PillButton type="submit" variant="teal" className="h-11 flex-1 sm:max-w-[220px]" disabled={busy}>
            {busy ? "Inviting…" : "Send invite"}
          </PillButton>
        </div>
      </form>
    </PanelOrModal>
  );
}
