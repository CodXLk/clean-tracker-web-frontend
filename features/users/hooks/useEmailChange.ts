"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { UserSchema, type User } from "@/features/users/schemas/user.schema";
import { userKeys } from "./userKeys";

const EmailChangePendingSchema = z.object({
  pendingEmail: z.string(),
  expiresAt: z.string(),
  // False when a still-valid code was sent to this address moments ago, so no new email went out.
  codeSent: z.boolean().default(true),
});
export type EmailChangePending = z.infer<typeof EmailChangePendingSchema>;

/**
 * Self-service sign-in email change with verification: confirms the current password and emails a
 * code to the new address. The email doesn't change until the code is verified.
 */
export function useRequestEmailChange() {
  return useMutation({
    mutationFn: async (input: { newEmail: string; currentPassword: string }): Promise<EmailChangePending> => {
      const { data } = await clientApi.post(ENDPOINTS.users.emailChange, {
        newEmail: input.newEmail.trim(),
        currentPassword: input.currentPassword,
      });
      return EmailChangePendingSchema.parse(data);
    },
  });
}

/**
 * Confirms the pending email change with the emailed code. The session token still names the old email;
 * the API client's single-flight 401 refresh re-issues it on the next request.
 */
export function useVerifyEmailChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string): Promise<User> => {
      const { data } = await clientApi.post(ENDPOINTS.users.emailChangeVerify, { code: code.trim() });
      return UserSchema.parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useCancelEmailChange() {
  return useMutation({
    mutationFn: async () => {
      await clientApi.delete(ENDPOINTS.users.emailChange);
    },
  });
}