"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  TaskAssignmentListSchema,
  TaskAssignmentSchema,
  WorkforceStatsSchema,
  type AssignmentFormInput,
  type TaskAssignment,
  type WorkforceStats,
} from "@/features/workforce/schemas/assignment.schema";
import { assignmentKeys } from "./assignmentKeys";

export interface DateRange {
  from: string; // yyyy-MM-dd
  to: string; // yyyy-MM-dd
}

/** A partial reschedule payload for the calendar drag/resize confirm popup. */
export interface RescheduleInput {
  scheduledDate: string;
  startTime: string;
  durationMinutes: number;
}

function toPayload(input: AssignmentFormInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    siteId: input.siteId,
    floorId: input.floorId,
    areaId: input.areaId,
    name: input.name.trim(),
    assignmentType: input.assignmentType,
    scheduledDate: input.date,
    startTime: input.time.length === 5 ? `${input.time}:00` : input.time,
    durationMinutes: Math.round(input.durationHours * 60),
    cleanerIds: input.cleanerIds,
  };
  if (input.description.trim()) payload.description = input.description.trim();
  if (input.assignmentType === "PERIODICAL_TASK") {
    payload.recurrenceType = input.recurrenceType;
    payload.recurrenceCount = input.recurrenceCount;
  }
  return payload;
}

async function fetchAssignments(range?: DateRange): Promise<TaskAssignment[]> {
  const { data } = await clientApi.get(ENDPOINTS.taskAssignments.list, {
    params: range ? { from: range.from, to: range.to } : undefined,
  });
  return TaskAssignmentListSchema.parse(data);
}

export function useTaskAssignments(range?: DateRange) {
  return useQuery({
    queryKey: assignmentKeys.list(range ? `${range.from}_${range.to}` : undefined),
    queryFn: () => fetchAssignments(range),
  });
}

async function fetchStats(): Promise<WorkforceStats> {
  const { data } = await clientApi.get(ENDPOINTS.taskAssignments.stats);
  return WorkforceStatsSchema.parse(data);
}

export function useWorkforceStats() {
  return useQuery({
    queryKey: assignmentKeys.stats(),
    queryFn: fetchStats,
  });
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: assignmentKeys.all });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AssignmentFormInput) => {
      const { data } = await clientApi.post(ENDPOINTS.taskAssignments.create, toPayload(input));
      return TaskAssignmentSchema.parse(data);
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<Record<string, unknown>> }) => {
      const { data } = await clientApi.put(ENDPOINTS.taskAssignments.byId(id), input);
      return TaskAssignmentSchema.parse(data);
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useRescheduleAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: RescheduleInput }) => {
      const { data } = await clientApi.patch(ENDPOINTS.taskAssignments.reschedule(id), input);
      return TaskAssignmentSchema.parse(data);
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await clientApi.delete(ENDPOINTS.taskAssignments.byId(id));
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}
