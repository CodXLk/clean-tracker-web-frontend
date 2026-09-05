"use client";

import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { useAuthStore } from "@/features/auth/store/auth.store";
import type {
  LoginInput,
  AccountSetupInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from "@/features/auth/schemas/auth.schema";

interface LoginResult {
  user: { id: string; name: string; role: string };
  requiresRoleSelection: boolean;
  availableRoles: string[];
}

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async (input: LoginInput): Promise<LoginResult> => {
      const { data } = await clientApi.post(ENDPOINTS.auth.login, input);
      return data as LoginResult;
    },
    // Only mark the session authenticated once a role is active. Multi-role users stay
    // "pending" until they pick a role via useSelectRole.
    onSuccess: (data) => {
      if (!data.requiresRoleSelection) setUser(data.user);
    },
  });
}

interface SelectRoleResult {
  user: { id: string; name: string; role: string };
}

export function useSelectRole() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (role: string): Promise<SelectRoleResult> => {
      const { data } = await clientApi.post(ENDPOINTS.auth.selectRole, { role });
      return data as SelectRoleResult;
    },
    onSuccess: (data) => {
      setUser(data.user);
      // The active role changed, so any role-scoped cached data (incl. /me) must be refetched.
      queryClient.invalidateQueries();
    },
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

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (input: ForgotPasswordInput) => {
      const { data } = await clientApi.post(ENDPOINTS.auth.forgotPassword, {
        email: input.email.trim(),
      });
      return data;
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (input: Omit<ResetPasswordInput, "confirmPassword">) => {
      const { data } = await clientApi.post(ENDPOINTS.auth.resetPassword, {
        email: input.email.trim(),
        otp: input.otp.trim(),
        newPassword: input.newPassword,
      });
      return data;
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (input: Omit<ChangePasswordInput, "confirmPassword">) => {
      const { data } = await clientApi.post(ENDPOINTS.auth.changePassword, {
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      });
      return data;
    },
  });
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: unknown } | undefined;
    const message = typeof data?.message === "string" ? data.message.trim() : "";
    // Guard against raw HTML/markup slipping through as a "message".
    if (message && !message.startsWith("<")) return message;
    return "Unable to sign in right now. Please try again.";
  }
  return error instanceof Error ? error.message : "Something went wrong";
}
