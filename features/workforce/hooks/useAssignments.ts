"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  AssignmentSchema,
  TaskOccurrenceListSchema,
  WorkforceStatsSchema,
  toCreateAssignmentPayload,
  type AssignmentFormInput,
  type OccurrenceScope,
  type TaskOccurrence,
  type TaskStatus,
  type WorkforceStats,
} from "@/features/workforce/schemas/assignment.schema";
import { assignmentKeys } from "./assignmentKeys";

export interface OccurrenceQuery {
  from: string; // yyyy-MM-dd
  to: string; // yyyy-MM-dd
  siteId?: string;
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
    params: { from: query.from, to: query.to, ...(query.siteId ? { siteId: query.siteId } : {}) },
  });
  return TaskOccurrenceListSchema.parse(data);
}

export function useOccurrences(query: OccurrenceQuery | undefined) {
  return useQuery({
    queryKey: assignmentKeys.occurrenceRange(
      query ? `${query.from}_${query.to}` : undefined,
      query?.siteId,
    ),
    queryFn: () => fetchOccurrences(query!),
    enabled: !!query,
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
