"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AccountSetupSchema, type AccountSetupInput } from "@/features/auth/schemas/auth.schema";
import { useSetupAccount, getAuthErrorMessage } from "@/features/auth/hooks/useAuth";
import { TextField } from "@/components/shared/TextField";
import { PillButton } from "@/components/shared/PillButton";

interface SetupAccountFormProps {
  email: string;
  temporaryPassword: string;
}

export function SetupAccountForm({ email, temporaryPassword }: SetupAccountFormProps) {
  const router = useRouter();
  const setup = useSetupAccount();
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountSetupInput>({
    resolver: zodResolver(AccountSetupSchema),
    defaultValues: { email, temporaryPassword, newPassword: "", confirmPassword: "" },
  });

  function onSubmit(values: AccountSetupInput) {
    setup.mutate(
      { email: values.email, temporaryPassword: values.temporaryPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          setDone(true);
          setTimeout(() => router.replace("/login"), 1500);
        },
      },
    );
  }

  if (done) {
    return (
      <div className="rounded-lg bg-success/10 px-4 py-3 text-sm font-medium text-success" role="status">
        Account setup complete. Redirecting you to sign in…
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <TextField label="Email" type="email" readOnly required error={errors.email?.message} {...register("email")} />
      <TextField
        label="Temporary password"
        hint="Pre-filled from your invitation link"
        required
        error={errors.temporaryPassword?.message}
        {...register("temporaryPassword")}
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
        required
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      {setup.isError && (
        <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
          {getAuthErrorMessage(setup.error)}
        </p>
      )}

      <PillButton type="submit" variant="teal" disabled={setup.isPending}>
        {setup.isPending ? "Setting up…" : "Complete setup"}
      </PillButton>
    </form>
  );
}
