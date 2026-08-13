"use client";

import { useQuery } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { CleanerDetailSchema, type CleanerDetail } from "@/features/cleaners/schemas/cleaner.schema";

/** Full cleaner profile (documents + assigned sites), resolved from the cleaner's user id. */
export function useCleanerDetailByUser(userId: string | undefined, enabled = true) {
  return useQuery<CleanerDetail>({
    queryKey: ["cleaner-detail", "by-user", userId],
    enabled: Boolean(userId) && enabled,
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.cleaners.detailByUser(userId as string));
      return CleanerDetailSchema.parse(data);
    },
  });
}
