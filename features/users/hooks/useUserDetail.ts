"use client";

import { useQuery } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { UserDetailSchema, type UserDetail } from "@/features/users/schemas/user.schema";

/** Full profile for a cleaner or supervisor (documents + assigned sites), keyed by user id. */
export function useUserDetail(userId: string | undefined, enabled = true) {
  return useQuery<UserDetail>({
    queryKey: ["user-detail", userId],
    enabled: Boolean(userId) && enabled,
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.users.detail(userId as string));
      return UserDetailSchema.parse(data);
    },
  });
}
