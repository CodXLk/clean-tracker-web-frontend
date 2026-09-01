"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, type LoginInput } from "@/features/auth/schemas/auth.schema";
import { useLogin, getAuthErrorMessage } from "@/features/auth/hooks/useAuth";
import { landingPath } from "@/lib/auth/roles";
import { TextField } from "@/components/shared/TextField";

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
        router.replace(callback || landingPath(role));
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
          className="text-sm font-medium text-brand-2 transition-colors hover:text-brand-2-dark"
        >
          Forgot password?
        </Link>
      </div>

      {login.isError && (
        <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
          {getAuthErrorMessage(login.error)}
        </p>
      )}

      <button
        type="submit"
        disabled={login.isPending}
        className="flex h-12 w-full items-center justify-center rounded-full bg-brand-2 text-sm font-semibold text-white transition-colors hover:bg-brand-2-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {login.isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
