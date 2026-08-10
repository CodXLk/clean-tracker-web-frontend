"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  OutsourceProjectListSchema,
  OutsourceProjectSchema,
  type CreateOutsourceProjectInput,
  type OutsourceProject,
} from "@/features/outsource/schemas/outsourceProject.schema";

const outsourceKeys = {
  all: ["outsource-projects"] as const,
  list: () => [...outsourceKeys.all, "list"] as const,
};

async function fetchProjects(): Promise<OutsourceProject[]> {
  const { data } = await clientApi.get(ENDPOINTS.outsourceProjects.list);
  return OutsourceProjectListSchema.parse(data);
}

export function useOutsourceProjects() {
  return useQuery({
    queryKey: outsourceKeys.list(),
    queryFn: fetchProjects,
  });
}

export function useCreateOutsourceProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateOutsourceProjectInput) => {
      const { data } = await clientApi.post(ENDPOINTS.outsourceProjects.create, input);
      return OutsourceProjectSchema.parse(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: outsourceKeys.all }),
  });
}

export function useDeleteOutsourceProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await clientApi.delete(ENDPOINTS.outsourceProjects.byId(id));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: outsourceKeys.all }),
  });
}
