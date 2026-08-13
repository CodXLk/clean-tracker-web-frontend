"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
  queryClient.invalidateQueries({ queryKey: ["users"] });
  queryClient.invalidateQueries({ queryKey: ["cleaners"] });
}

/** Upload/replace the current user's avatar. */
export function useUploadMyPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      await clientApi.post(ENDPOINTS.users.myPhoto, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => invalidate(queryClient),
  });
}

export function useDeleteMyPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await clientApi.delete(ENDPOINTS.users.myPhoto);
    },
    onSuccess: () => invalidate(queryClient),
  });
}

/** Upload/replace a specific user's avatar (management). */
export function useUploadUserPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, file }: { userId: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      await clientApi.post(ENDPOINTS.users.photo(userId), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => invalidate(queryClient),
  });
}
