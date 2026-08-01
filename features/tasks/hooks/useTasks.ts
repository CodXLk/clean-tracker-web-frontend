"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  TaskCompletionSchema,
  TaskOccurrenceListSchema,
  type CompleteTasksInput,
  type TaskOccurrence,
} from "@/features/tasks/schemas/task.schema";

export const taskKeys = {
  all: ["tasks"] as const,
  myOccurrences: (from: string, to: string, siteId?: string) =>
    [...taskKeys.all, "my-occurrences", from, to, siteId ?? "all"] as const,
};

async function fetchMyOccurrences(from: string, to: string, siteId?: string): Promise<TaskOccurrence[]> {
  const params: Record<string, string> = { from, to };
  if (siteId) params.siteId = siteId;
  const { data } = await clientApi.get(ENDPOINTS.tasks.myOccurrences, { params });
  return TaskOccurrenceListSchema.parse(data);
}

/** The calling cleaner's task occurrences for a date range (defaults to a single day). */
export function useMyTasks(from: string, to?: string, siteId?: string) {
  const toDate = to ?? from;
  return useQuery({
    queryKey: taskKeys.myOccurrences(from, toDate, siteId),
    queryFn: () => fetchMyOccurrences(from, toDate, siteId),
  });
}

export function useCompleteTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CompleteTasksInput) => {
      const formData = new FormData();
      const payload = {
        occurrences: input.occurrences,
        note: input.note?.trim() ? input.note.trim() : undefined,
      };
      formData.append(
        "data",
        new Blob([JSON.stringify(payload)], { type: "application/json" }),
      );
      for (const photo of input.photos ?? []) {
        formData.append("photos", photo);
      }
      // Override the instance's default JSON content-type so axios computes the
      // multipart boundary from the FormData body.
      const { data } = await clientApi.post(ENDPOINTS.tasks.complete, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return TaskCompletionSchema.parse(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  });
}

/** Supervisor review: mark selected task occurrences as completed (no photos/note persisted). */
export function useReviewComplete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (occurrences: { taskId: string; date: string }[]) => {
      await clientApi.post(ENDPOINTS.tasks.reviewComplete, { occurrences });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  });
}
