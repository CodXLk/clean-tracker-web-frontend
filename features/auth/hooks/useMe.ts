"use client";

import { useQuery } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { UserSchema, type User } from "@/features/users/schemas/user.schema";

async function fetchMe(): Promise<User> {
  const { data } = await clientApi.get(ENDPOINTS.auth.me);
  return UserSchema.parse(data);
}

export function useMe() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
