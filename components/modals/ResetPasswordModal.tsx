"use client";

import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils/cn";
import { PillButton } from "@/components/shared/PillButton";
import { TextField } from "@/components/shared/TextField";
import {
  ChangePasswordSchema,
  type ChangePasswordInput,
} from "@/features/auth/schemas/auth.schema";
import { useChangePassword, getAuthErrorMessage } from "@/features/auth/hooks/useAuth";

interface ResetPasswordModalProps {
  open:    boolean;
  onClose: () => void;
}

export function ResetPasswordModal({ open, onClose }: ResetPasswordModalProps) {
  const changePassword = useChangePassword();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  // Reset form + mutation state whenever the modal is reopened.
  useEffect(() => {
    if (open) {
      reset();
      changePassword.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  function onSubmit(values: ChangePasswordInput) {
    changePassword.mutate(values);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Change password"
        className={cn(
          "fixed z-50 bg-white p-6",
          "inset-x-0 bottom-0 rounded-t-3xl min-h-[50vh] max-h-[85vh] overflow-y-auto",
          "lg:inset-0 lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:min-h-0 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-md lg:rounded-3xl lg:shadow-2xl",
        )}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-on-surface">Change password</h2>
          <button
            onClick={onClose}
            aria-label="Close change password"
            className="rounded-full p-0.5 text-danger transition-colors hover:bg-danger/10"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {changePassword.isSuccess ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <CheckCircle2 size={44} className="text-success" />
            <p className="text-sm text-grey-600">Your password has been updated.</p>
            <PillButton variant="teal" onClick={onClose}>
              Done
            </PillButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <TextField
              label="Current password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter current password"
              required
              error={errors.currentPassword?.message}
              {...register("currentPassword")}
            />
            <TextField
              label="New password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              required
              error={errors.newPassword?.message}
              {...register("newPassword")}
            />
            <TextField
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter new password"
              required
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />

            {changePassword.isError && (
              <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
                {getAuthErrorMessage(changePassword.error)}
              </p>
            )}

            <PillButton type="submit" variant="orange" disabled={changePassword.isPending}>
              {changePassword.isPending ? "Saving…" : "Save"}
            </PillButton>
          </form>
        )}
      </div>
    </>
  );
}
