"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, type LoginInput } from "@/features/auth/schemas/auth.schema";
import { useLogin, getAuthErrorMessage } from "@/features/auth/hooks/useAuth";
import { isAdminRole, landingPath } from "@/lib/auth/roles";
import { TextField } from "@/components/shared/TextField";
import { PillButton } from "@/components/shared/PillButton";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: LoginInput) {
    login.mutate(values, {
      onSuccess: (data) => {
        const role = data.user.role;
        const callback = searchParams.get("callbackUrl");
        // Honour the callback only when it's allowed for the user's role.
        const callbackAllowed = callback && (isAdminRole(role) || !callback.startsWith("/admin"));
        router.replace(callbackAllowed ? callback : landingPath(role));
      },
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@company.com"
        required
        error={errors.email?.message}
        {...register("email")}
      />
      <TextField
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="Your password"
        required
        error={errors.password?.message}
        {...register("password")}
      />

      <div className="-mt-2 text-right">
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-primary transition-opacity hover:opacity-80"
        >
          Forgot password?
        </Link>
      </div>

      {login.isError && (
        <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
          {getAuthErrorMessage(login.error)}
        </p>
      )}

      <PillButton type="submit" variant="teal" disabled={login.isPending}>
        {login.isPending ? "Signing in…" : "Sign in"}
      </PillButton>
    </form>
  );
}
