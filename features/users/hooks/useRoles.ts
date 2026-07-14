"use client";

import { useQuery } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { RoleOptionListSchema, type RoleOption } from "@/features/users/schemas/user.schema";
import { roleKeys } from "./roleKeys";

async function fetchRoles(): Promise<RoleOption[]> {
  const { data } = await clientApi.get(ENDPOINTS.roles.list);
  return RoleOptionListSchema.parse(data);
}

export function useRoles() {
  return useQuery({
    queryKey: roleKeys.lists(),
    queryFn: fetchRoles,
  });
}
