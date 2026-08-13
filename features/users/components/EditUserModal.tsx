"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { PhoneNumberField } from "@/components/shared/PhoneNumberField";
import { PillButton } from "@/components/shared/PillButton";
import { UpdateUserSchema, type UpdateUserInput, type User } from "@/features/users/schemas/user.schema";
import { useUpdateUser } from "@/features/users/hooks/useUserActions";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

export function EditUserModal({ open, onClose, user }: EditUserModalProps) {
  const update = useUpdateUser();

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
    update.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  function close() {
    update.reset();
    onClose();
  }

  function onSubmit(values: UpdateUserInput) {
    if (!user) return;
    // Drop an empty DOB so the backend doesn't try to parse "" as a date.
    const input: UpdateUserInput = { ...values, dateOfBirth: values.dateOfBirth || undefined };
    update.mutate({ id: user.id, input }, { onSuccess: close });
  }

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
    </Modal>
  );
}
