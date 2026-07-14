"use client";

import { useQuery } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { CleanerListSchema, type Cleaner } from "@/features/cleaners/schemas/cleaner.schema";

export const cleanerKeys = {
  all: ["cleaners"] as const,
  lists: () => [...cleanerKeys.all, "list"] as const,
  detail: (id: string) => [...cleanerKeys.all, "detail", id] as const,
};

async function fetchCleaners(): Promise<Cleaner[]> {
  const { data } = await clientApi.get(ENDPOINTS.cleaners.list);
  return CleanerListSchema.parse(data);
}

export function useCleaners() {
  return useQuery({
    queryKey: cleanerKeys.lists(),
    queryFn: fetchCleaners,
  });
}
