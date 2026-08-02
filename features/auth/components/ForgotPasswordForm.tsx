"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import {
  ForgotPasswordSchema,
  ResetPasswordSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/features/auth/schemas/auth.schema";
import {
  useForgotPassword,
  useResetPassword,
  getAuthErrorMessage,
} from "@/features/auth/hooks/useAuth";
import { TextField } from "@/components/shared/TextField";
import { PillButton } from "@/components/shared/PillButton";

type Step = "email" | "reset" | "done";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");

  const forgot = useForgotPassword();
  const reset = useResetPassword();

  const emailForm = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const resetForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { email: "", otp: "", newPassword: "", confirmPassword: "" },
  });

  function onRequestCode(values: ForgotPasswordInput) {
    forgot.mutate(values, {
      onSuccess: () => {
        setEmail(values.email.trim());
        resetForm.setValue("email", values.email.trim());
        setStep("reset");
      },
    });
  }

  function onResetPassword(values: ResetPasswordInput) {
    reset.mutate(values, {
      onSuccess: () => setStep("done"),
    });
  }

  function resendCode() {
    if (!email) return;
    forgot.mutate({ email });
  }

  if (step === "done") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <CheckCircle2 size={48} className="text-success" />
        <p className="text-sm text-grey-600">
          Your password has been reset. You can now sign in with your new password.
        </p>
        <PillButton variant="teal" onClick={() => router.replace("/login")}>
          Back to sign in
        </PillButton>
      </div>
    );
  }

  if (step === "reset") {
    return (
      <form
        onSubmit={resetForm.handleSubmit(onResetPassword)}
        className="flex flex-col gap-5"
        noValidate
      >
        <p className="text-sm text-grey-600">
          We&apos;ve sent a verification code to{" "}
          <span className="font-medium text-on-surface">{email}</span>. Enter it below with your
          new password.
        </p>

        <TextField
          label="Verification code"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="Enter the code"
          required
          error={resetForm.formState.errors.otp?.message}
          {...resetForm.register("otp")}
        />
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          required
          error={resetForm.formState.errors.newPassword?.message}
          {...resetForm.register("newPassword")}
        />
        <TextField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          required
          error={resetForm.formState.errors.confirmPassword?.message}
          {...resetForm.register("confirmPassword")}
        />

        {reset.isError && (
          <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
            {getAuthErrorMessage(reset.error)}
          </p>
        )}

        <PillButton type="submit" variant="teal" disabled={reset.isPending}>
          {reset.isPending ? "Resetting…" : "Reset password"}
        </PillButton>

        <button
          type="button"
          onClick={resendCode}
          disabled={forgot.isPending}
          className="text-sm font-medium text-primary transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {forgot.isPending ? "Sending…" : "Didn't get a code? Resend"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={emailForm.handleSubmit(onRequestCode)} className="flex flex-col gap-5" noValidate>
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@company.com"
        required
        error={emailForm.formState.errors.email?.message}
        {...emailForm.register("email")}
      />

      {forgot.isError && (
        <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
          {getAuthErrorMessage(forgot.error)}
        </p>
      )}

      <PillButton type="submit" variant="teal" disabled={forgot.isPending}>
        {forgot.isPending ? "Sending…" : "Send reset code"}
      </PillButton>

      <Link
        href="/login"
        className="text-center text-sm font-medium text-primary transition-opacity hover:opacity-80"
      >
        Back to sign in
      </Link>
    </form>
  );
}
