"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PanelOrModal } from "@/components/shared/PanelOrModal";
import { TextField } from "@/components/shared/TextField";
import { PhoneNumberField } from "@/components/shared/PhoneNumberField";
import { PillButton } from "@/components/shared/PillButton";
import { UpdateUserSchema, type UpdateUserInput, type User } from "@/features/users/schemas/user.schema";
import { useUpdateUser } from "@/features/users/hooks/useUserActions";
import { useUploadUserPhoto, useDeleteUserPhoto } from "@/features/users/hooks/useProfilePhoto";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { AvatarUploadField } from "./AvatarUploadField";

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  embedded?: boolean;
}

export function EditUserModal({ open, onClose, user, embedded }: EditUserModalProps) {
  const update = useUpdateUser();
  const uploadPhoto = useUploadUserPhoto();
  const deletePhoto = useDeleteUserPhoto();
  const [photoFile, setPhotoFile] = useState<File | null>(null);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhotoFile(null);
    update.reset();
    uploadPhoto.reset();
    deletePhoto.reset();
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

  function handleSelectPhoto(file: File) {
    if (!user) return;
    setPhotoFile(file);
    uploadPhoto.mutate({ userId: user.id, file });
  }

  function handleRemovePhoto() {
    if (!user) return;
    setPhotoFile(null);
    if (user.hasPhoto) deletePhoto.mutate(user.id);
  }

  return (
    <PanelOrModal embedded={embedded} open={open} onClose={close} title="Edit details" description="Update the person's name, phone and date of birth." embeddedMaxWidthClassName="w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        <div
          className={`flex flex-col gap-5 rounded-2xl border border-grey-200 bg-surface p-4 sm:p-5 ${
            embedded ? "lg:flex-row lg:items-start" : ""
          }`}
        >
          <div className="flex justify-center lg:justify-start">
            <AvatarUploadField
              file={photoFile}
              onSelect={handleSelectPhoto}
              onRemove={handleRemovePhoto}
              userId={user?.id}
              hasPhoto={user?.hasPhoto}
              version={user?.updatedAt}
              firstName={user?.firstName}
              lastName={user?.lastName}
              busy={uploadPhoto.isPending || deletePhoto.isPending}
            />
          </div>
          <div className="flex flex-1 flex-col gap-4">
            {(uploadPhoto.isError || deletePhoto.isError) && (
              <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
                {getErrorMessage(uploadPhoto.error ?? deletePhoto.error)}
              </p>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="First name" error={errors.firstName?.message} {...register("firstName")} />
              <TextField label="Last name" error={errors.lastName?.message} {...register("lastName")} />
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
        </div>

        {update.isError && (
          <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
            {getErrorMessage(update.error)}
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
          <PillButton type="submit" variant="teal" className="h-11 flex-1 sm:max-w-[220px]" disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save changes"}
          </PillButton>
        </div>
      </form>
    </PanelOrModal>
  );
}
