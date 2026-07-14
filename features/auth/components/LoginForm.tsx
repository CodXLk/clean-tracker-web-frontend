"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, type LoginInput } from "@/features/auth/schemas/auth.schema";
import { useLogin, getAuthErrorMessage } from "@/features/auth/hooks/useAuth";
import { TextField } from "@/components/shared/TextField";
import { PillButton } from "@/components/shared/PillButton";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "COMPANY_ADMIN", "CLIENT_SERVICE_MANAGER"]);

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
        const callback = searchParams.get("callbackUrl");
        const destination = callback ?? (ADMIN_ROLES.has(data.user.role) ? "/admin/dashboard" : "/dashboard");
        router.replace(destination);
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
