"use client";

import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { useAuthStore } from "@/features/auth/store/auth.store";
import type { LoginInput, AccountSetupInput } from "@/features/auth/schemas/auth.schema";

interface LoginResult {
  user: { id: string; name: string; role: string };
}

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async (input: LoginInput): Promise<LoginResult> => {
      const { data } = await clientApi.post(ENDPOINTS.auth.login, input);
      return data as LoginResult;
    },
    onSuccess: (data) => setUser(data.user),
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  return useMutation({
    mutationFn: async () => {
      await clientApi.post(ENDPOINTS.auth.logout);
    },
    onSuccess: () => clear(),
  });
}

export function useSetupAccount() {
  return useMutation({
    mutationFn: async (input: Omit<AccountSetupInput, "confirmPassword">) => {
      const { data } = await clientApi.post(ENDPOINTS.auth.accountSetup, {
        email: input.email,
        temporaryPassword: input.temporaryPassword,
        newPassword: input.newPassword,
      });
      return data;
    },
  });
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message ?? error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong";
}
