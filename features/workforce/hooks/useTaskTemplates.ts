"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  TaskTemplateListSchema,
  TaskTemplateSchema,
  type TaskTemplate,
  type SaveTaskTemplateInput,
} from "@/features/workforce/schemas/taskTemplate.schema";

const templateKeys = {
  all: ["task-templates"] as const,
  list: () => [...templateKeys.all, "list"] as const,
};

async function fetchTemplates(): Promise<TaskTemplate[]> {
  const { data } = await clientApi.get(ENDPOINTS.taskTemplates.list);
  return TaskTemplateListSchema.parse(data);
}

export function useTaskTemplates() {
  return useQuery({
    queryKey: templateKeys.list(),
    queryFn: fetchTemplates,
  });
}

export function useSaveTaskTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: SaveTaskTemplateInput }) => {
      const body = { name: input.name, tasks: input.tasks };
      const { data } = id
        ? await clientApi.put(ENDPOINTS.taskTemplates.byId(id), body)
        : await clientApi.post(ENDPOINTS.taskTemplates.create, body);
      return TaskTemplateSchema.parse(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: templateKeys.all }),
  });
}

export function useDeleteTaskTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await clientApi.delete(ENDPOINTS.taskTemplates.byId(id));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: templateKeys.all }),
  });
}
