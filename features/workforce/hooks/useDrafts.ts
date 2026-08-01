"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  AssignmentDraftListSchema,
  AssignmentDraftSchema,
  type AssignmentDraft,
  type SaveDraftInput,
} from "@/features/workforce/schemas/draft.schema";

const draftKeys = {
  all: ["assignment-drafts"] as const,
  list: () => [...draftKeys.all, "list"] as const,
};

async function fetchDrafts(): Promise<AssignmentDraft[]> {
  const { data } = await clientApi.get(ENDPOINTS.assignmentDrafts.list);
  return AssignmentDraftListSchema.parse(data);
}

export function useDrafts() {
  return useQuery({
    queryKey: draftKeys.list(),
    queryFn: fetchDrafts,
  });
}

export function useSaveDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: SaveDraftInput }) => {
      const body = {
        ...(input.title ? { title: input.title } : {}),
        ...(input.siteId ? { siteId: input.siteId } : {}),
        payload: input.payload,
      };
      const { data } = id
        ? await clientApi.put(ENDPOINTS.assignmentDrafts.byId(id), body)
        : await clientApi.post(ENDPOINTS.assignmentDrafts.create, body);
      return AssignmentDraftSchema.parse(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: draftKeys.all }),
  });
}

export function useDeleteDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await clientApi.delete(ENDPOINTS.assignmentDrafts.byId(id));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: draftKeys.all }),
  });
}
