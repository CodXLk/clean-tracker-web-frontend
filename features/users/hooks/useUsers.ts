"use client";

import { useQuery } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { UserListSchema, type User } from "@/features/users/schemas/user.schema";
import { userKeys } from "./userKeys";

async function fetchUsers(): Promise<User[]> {
  const { data } = await clientApi.get(ENDPOINTS.users.list);
  return UserListSchema.parse(data);
}

export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: fetchUsers,
  });
}
