"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  TaskCompletionSchema,
  TaskHistorySchema,
  TaskOccurrenceListSchema,
  DraftPhotoListSchema,
  type CompleteTasksInput,
  type DraftPhoto,
  type PhotoStage,
  type TaskHistory,
  type TaskOccurrence,
} from "@/features/tasks/schemas/task.schema";

export const taskKeys = {
  all: ["tasks"] as const,
  myOccurrences: (from: string, to: string, siteId?: string) =>
    [...taskKeys.all, "my-occurrences", from, to, siteId ?? "all"] as const,
  history: (taskId: string, date: string) => [...taskKeys.all, "history", taskId, date] as const,
  draftPhotos: (sig: string) => [...taskKeys.all, "draft-photos", sig] as const,
};

/** Occurrences a draft-photo action targets — a task occurrence (taskId + date). */
export interface DraftOccurrenceRef {
  taskId: string;
  date: string;
}

/** Stable key for a set of occurrences, order-independent. */
function occurrenceSignature(occurrences: DraftOccurrenceRef[]): string {
  return occurrences
    .map((o) => `${o.taskId}|${o.date}`)
    .sort()
    .join(",");
}

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

/** A task's completion history since the site's last inspection (supervisor review). */
export function useTaskHistory(taskId: string | null, date: string, enabled = true) {
  return useQuery({
    queryKey: taskKeys.history(taskId ?? "none", date),
    enabled: enabled && !!taskId,
    queryFn: async (): Promise<TaskHistory> => {
      const { data } = await clientApi.get(ENDPOINTS.tasks.history(taskId as string), { params: { date } });
      return TaskHistorySchema.parse(data);
    },
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
      for (const photo of input.beforePhotos ?? []) {
        formData.append("beforePhotos", photo);
      }
      for (const photo of input.afterPhotos ?? []) {
        formData.append("afterPhotos", photo);
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

/** Draft (pre-completion) photos saved for a selection, so before/after shots survive closing
 *  the completion box and reappear on return. */
export function useDraftPhotos(occurrences: DraftOccurrenceRef[], enabled = true) {
  const sig = occurrenceSignature(occurrences);
  return useQuery({
    queryKey: taskKeys.draftPhotos(sig),
    enabled: enabled && occurrences.length > 0,
    queryFn: async (): Promise<DraftPhoto[]> => {
      const { data } = await clientApi.post(ENDPOINTS.tasks.draftPhotosList, { occurrences });
      return DraftPhotoListSchema.parse(data);
    },
  });
}

/** Save before/after photos against a selection without completing it. */
export function useSaveDraftPhotos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      occurrences: DraftOccurrenceRef[];
      type: PhotoStage;
      photos: File[];
    }): Promise<DraftPhoto[]> => {
      const formData = new FormData();
      formData.append(
        "data",
        new Blob([JSON.stringify({ occurrences: input.occurrences, type: input.type })], {
          type: "application/json",
        }),
      );
      for (const photo of input.photos) {
        formData.append("photos", photo);
      }
      const { data } = await clientApi.post(ENDPOINTS.tasks.draftPhotos, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return DraftPhotoListSchema.parse(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...taskKeys.all, "draft-photos"] }),
  });
}

/** Remove a saved draft photo. */
export function useDeleteDraftPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await clientApi.delete(ENDPOINTS.tasks.draftPhoto(id));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...taskKeys.all, "draft-photos"] }),
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

export interface CompleteForInspectionInput {
  occurrences: { taskId: string; date: string }[];
  note?: string;
  beforePhotos?: File[];
  afterPhotos?: File[];
}

/** Supervisor: complete a task occurrence (with optional photos) so it can then be inspected. */
export function useCompleteForInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CompleteForInspectionInput) => {
      const formData = new FormData();
      const payload = {
        occurrences: input.occurrences,
        note: input.note?.trim() ? input.note.trim() : undefined,
      };
      formData.append(
        "data",
        new Blob([JSON.stringify(payload)], { type: "application/json" }),
      );
      for (const photo of input.beforePhotos ?? []) {
        formData.append("beforePhotos", photo);
      }
      for (const photo of input.afterPhotos ?? []) {
        formData.append("afterPhotos", photo);
      }
      await clientApi.post(ENDPOINTS.tasks.inspectComplete, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  });
}

export interface SubmitInspectionInput {
  occurrences: { taskId: string; date: string }[];
  /** Exactly one of rating/complaintId must be set. */
  rating?: number;
  complaintId?: string;
}

/** Supervisor: close out an inspection of the selected occurrences via rating or a linked complaint. */
export function useSubmitInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SubmitInspectionInput) => {
      await clientApi.post(ENDPOINTS.tasks.inspect, input);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  });
}
