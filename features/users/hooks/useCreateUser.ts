"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { UserSchema, type CreateUserInput, type User } from "@/features/users/schemas/user.schema";
import { userKeys } from "./userKeys";

async function createUser(input: CreateUserInput): Promise<User> {
  // Drop empty-string optionals so the backend treats them as absent.
  const payload: Record<string, unknown> = {
    firstName: input.firstName,
    email: input.email,
    role: input.role,
  };
  if (input.lastName) payload.lastName = input.lastName;
  if (input.phoneNumber) payload.phoneNumber = input.phoneNumber;

  const { data } = await clientApi.post(ENDPOINTS.users.create, payload);
  return UserSchema.parse(data);
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message ?? error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong";
}
