"use client";

import { useMemo } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  AssignmentSchema,
  TaskOccurrenceListSchema,
  SiteTaskSummaryListSchema,
  SiteTaskStatusCountsSchema,
  WorkforceStatsSchema,
  TaskEditDetailSchema,
  toCreateAssignmentPayload,
  type Assignment,
  type AssignmentFormInput,
  type OccurrenceScope,
  type SiteTaskSummary,
  type SiteTaskStatusCounts,
  type TaskOccurrence,
  type TaskStatus,
  type TaskEditDetail,
  type WorkforceStats,
} from "@/features/workforce/schemas/assignment.schema";
import { assignmentKeys } from "./assignmentKeys";

export interface OccurrenceQuery {
  from: string; // yyyy-MM-dd
  to: string; // yyyy-MM-dd
  siteId?: string;
  /** Task lifecycle filter: ACTIVE (default) | INACTIVE | DELETED | ALL. */
  taskStatus?: string;
}

/** Fields of one occurrence that a scoped edit (drag/resize/edit modal) can change. */
export interface EditOccurrenceInput {
  scope: OccurrenceScope;
  newDate?: string;
  newStartTime?: string;
  newDurationMinutes?: number;
  name?: string;
  description?: string;
  colorHex?: string;
  /** Per-day status change (start / complete one occurrence) — scope THIS only. */
  status?: TaskStatus;
}

async function fetchOccurrences(query: OccurrenceQuery): Promise<TaskOccurrence[]> {
  const { data } = await clientApi.get(ENDPOINTS.assignments.occurrences, {
    params: {
      from: query.from,
      to: query.to,
      ...(query.siteId ? { siteId: query.siteId } : {}),
      ...(query.taskStatus ? { taskStatus: query.taskStatus } : {}),
    },
  });
  return TaskOccurrenceListSchema.parse(data);
}

export function useOccurrences(query: OccurrenceQuery | undefined) {
  return useQuery({
    queryKey: [
      ...assignmentKeys.occurrenceRange(
        query ? `${query.from}_${query.to}` : undefined,
        query?.siteId,
      ),
      query?.taskStatus ?? "ACTIVE",
    ],
    queryFn: () => fetchOccurrences(query!),
    enabled: !!query,
  });
}

/** All tasks for one site (with each task's next date after the visible week). */
export function useSiteTasks(query: OccurrenceQuery | undefined) {
  return useQuery({
    queryKey: ["site-tasks", query ? `${query.from}_${query.to}` : "none", query?.siteId ?? "all", query?.taskStatus ?? "ACTIVE"],
    enabled: !!query && !!query.siteId,
    queryFn: async (): Promise<SiteTaskSummary[]> => {
      const { data } = await clientApi.get(ENDPOINTS.assignments.siteTasks, {
        params: {
          from: query!.from,
          to: query!.to,
          ...(query!.siteId ? { siteId: query!.siteId } : {}),
          ...(query!.taskStatus ? { taskStatus: query!.taskStatus } : {}),
        },
      });
      return SiteTaskSummaryListSchema.parse(data);
    },
  });
}

async function fetchStats(): Promise<WorkforceStats> {
  const { data } = await clientApi.get(ENDPOINTS.assignments.stats);
  return WorkforceStatsSchema.parse(data);
}

export function useWorkforceStats() {
  return useQuery({
    queryKey: assignmentKeys.stats(),
    queryFn: fetchStats,
  });
}

async function fetchTaskNames(): Promise<string[]> {
  const { data } = await clientApi.get(ENDPOINTS.assignments.taskNames);
  return Array.isArray(data) ? (data as string[]) : [];
}

/** Distinct previously-used task names, for the task-name autocomplete. */
export function useTaskNameSuggestions() {
  return useQuery({
    queryKey: assignmentKeys.taskNames(),
    queryFn: fetchTaskNames,
    staleTime: 60_000,
  });
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: assignmentKeys.all });
  queryClient.invalidateQueries({ queryKey: ["site-tasks"] });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AssignmentFormInput) => {
      const { data } = await clientApi.post(
        ENDPOINTS.assignments.create,
        toCreateAssignmentPayload(input),
      );
      return AssignmentSchema.parse(data);
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}

/** Persist a new task display order within an area (super admin / company admin). */
export function useReorderTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ areaId, taskIds }: { areaId: string; taskIds: string[] }) => {
      await clientApi.put(ENDPOINTS.assignments.tasksReorder, { areaId, taskIds });
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useEditOccurrence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      occurrenceDate,
      input,
    }: {
      taskId: string;
      occurrenceDate: string;
      input: EditOccurrenceInput;
    }) => {
      const { data } = await clientApi.patch(
        ENDPOINTS.assignments.occurrence(taskId, occurrenceDate),
        input,
      );
      return AssignmentSchema.parse(data);
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}

/** Content fields of one occurrence that a scoped content-edit can change. */
export interface EditOccurrenceContentInput {
  scope: OccurrenceScope;
  name?: string;
  durationMinutes?: number;
  description?: string;
  colorHex?: string;
  profileIds?: string[];
  cleanerIds?: string[];
  supervisorIds?: string[];
  items?: { itemId: string; quantity: number }[];
}

export function useEditOccurrenceContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      occurrenceDate,
      input,
    }: {
      taskId: string;
      occurrenceDate: string;
      input: EditOccurrenceContentInput;
    }) => {
      const { data } = await clientApi.put(
        ENDPOINTS.assignments.occurrenceContent(taskId, occurrenceDate),
        input,
      );
      return AssignmentSchema.parse(data);
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useDeleteOccurrence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      occurrenceDate,
      scope,
    }: {
      taskId: string;
      occurrenceDate: string;
      scope: OccurrenceScope;
    }) => {
      await clientApi.delete(ENDPOINTS.assignments.occurrence(taskId, occurrenceDate), {
        params: { scope },
      });
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await clientApi.delete(ENDPOINTS.assignments.byId(id));
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}

/** One occurrence reference — the task and the date it falls on. */
export interface OccurrenceRefInput {
  taskId: string;
  occurrenceDate: string; // yyyy-MM-dd (the series date shown on the calendar)
}

/**
 * Copy a day's occurrences (e.g. every task of one work type) onto another date. Each is
 * duplicated as a standalone one-day task carrying all its content — cleaner/supervisor slots,
 * items, colour, duration — so only the date changes. Cleaners/supervisors are notified.
 */
export function useCopyOccurrences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      targetDate,
      occurrences,
    }: {
      targetDate: string;
      occurrences: OccurrenceRefInput[];
    }) => {
      await clientApi.post(ENDPOINTS.assignments.occurrencesCopy, { targetDate, occurrences });
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}

/** Delete a set of occurrences for their dates only (e.g. all tasks of one work type on a day). */
export function useDeleteOccurrencesBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ occurrences }: { occurrences: OccurrenceRefInput[] }) => {
      await clientApi.post(ENDPOINTS.assignments.occurrencesDelete, { occurrences });
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}


/** Full assignment detail (all tasks, recurrence, cleaners, supervisors, items). */
export function useAssignment(id: string | undefined) {
  return useQuery({
    queryKey: ["assignment", id ?? "none"],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.assignments.byId(id!));
      return AssignmentSchema.parse(data);
    },
  });
}

/** Full details for several assignments at once (shares cache with {@link useAssignment}). */
export function useAssignmentsByIds(ids: string[]) {
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ["assignment", id],
      enabled: !!id,
      queryFn: async () => {
        const { data } = await clientApi.get(ENDPOINTS.assignments.byId(id));
        return AssignmentSchema.parse(data);
      },
    })),
  });
  const loaded = ids.length > 0 && results.every((r) => r.data);
  const isLoading = results.some((r) => r.isLoading);
  // Keep the returned array referentially stable while the underlying data is unchanged.
  const signature = results.map((r) => r.dataUpdatedAt).join(",");
  const data = useMemo(
    () => (loaded ? (results.map((r) => r.data) as Assignment[]) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loaded, signature],
  );
  return { data, isLoading };
}

/** Update an existing assignment/series in place (whole assignment). */
export function useUpdateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: AssignmentFormInput }) => {
      const { data } = await clientApi.put(
        ENDPOINTS.assignments.byId(id),
        toCreateAssignmentPayload(input),
      );
      return AssignmentSchema.parse(data);
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}

/** Soft-delete a task (keeps completion history, stops future occurrences). */
export function useSoftDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      await clientApi.delete(ENDPOINTS.assignments.taskById(taskId));
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}

/** Set a task's lifecycle status (ACTIVE / INACTIVE / DELETED). */
export function useSetTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: "ACTIVE" | "INACTIVE" | "DELETED" }) => {
      await clientApi.patch(ENDPOINTS.assignments.taskStatus(taskId), null, { params: { status } });
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}

/** Restore a soft-deleted task back to ACTIVE. */
export function useRestoreTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      await clientApi.post(ENDPOINTS.assignments.taskRestore(taskId));
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}

/** Update a task's critical level inline from the scope view. */
export function useSetTaskCriticalLevel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      level,
      note,
    }: {
      taskId: string;
      level: "LOW" | "MEDIUM" | "HIGH";
      note?: string;
    }) => {
      await clientApi.patch(ENDPOINTS.assignments.taskCriticalLevel(taskId), {
        level,
        note: note ?? null,
      });
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}

/** Task counts per lifecycle status at a site (drives the filter badges). */
export function useSiteTaskStatusCounts(query: OccurrenceQuery | undefined) {
  return useQuery({
    queryKey: ["site-task-counts", query ? `${query.from}_${query.to}` : "none", query?.siteId ?? "all"],
    enabled: !!query && !!query.siteId,
    queryFn: async (): Promise<SiteTaskStatusCounts> => {
      const { data } = await clientApi.get(ENDPOINTS.assignments.siteTaskCounts, {
        params: {
          from: query!.from,
          to: query!.to,
          ...(query!.siteId ? { siteId: query!.siteId } : {}),
        },
      });
      return SiteTaskStatusCountsSchema.parse(data);
    },
  });
}

/** How many completions a task already has — shown before soft-deleting it. */
export async function fetchTaskCompletionCount(taskId: string): Promise<number> {
  const { data } = await clientApi.get(ENDPOINTS.assignments.taskCompletionCount(taskId));
  const count = (data as { count?: number } | null)?.count;
  return typeof count === "number" ? count : 0;
}

/** Upload reference photos for a HIGH-critical task (multipart). Returns new photo IDs. */
export async function uploadTaskReferencePhotos(
  taskId: string,
  files: File[],
): Promise<string[]> {
  if (files.length === 0) return [];
  const form = new FormData();
  for (const file of files) form.append("photos", file);
  const { data } = await clientApi.post(
    ENDPOINTS.assignments.taskReferencePhotos(taskId),
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return Array.isArray(data) ? (data as string[]) : [];
}

/** Load a task's editable details (name, priority, note, reference photo ids). */
export function useTaskEditDetail(taskId: string | undefined) {
  return useQuery({
    queryKey: ["task-edit-detail", taskId ?? "none"],
    enabled: !!taskId,
    queryFn: async (): Promise<TaskEditDetail> => {
      const { data } = await clientApi.get(ENDPOINTS.assignments.taskById(taskId!));
      return TaskEditDetailSchema.parse(data);
    },
  });
}

/** Rename a task and (for HIGH tasks) update its note. */
export function useUpdateTaskDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      name,
      criticalNote,
    }: {
      taskId: string;
      name: string;
      criticalNote?: string | null;
    }) => {
      await clientApi.patch(ENDPOINTS.assignments.taskById(taskId), {
        name,
        criticalNote: criticalNote ?? null,
      });
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}

/** Delete a single reference photo. */
export async function deleteTaskReferencePhoto(photoId: string): Promise<void> {
  await clientApi.delete(ENDPOINTS.assignments.referencePhoto(photoId));
}
