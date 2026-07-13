"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { completeTask } from "@/features/inspections/services/inspection.service";
import type { CompleteTaskInput } from "@/features/inspections/schemas/inspection.schema";
import { inspectionKeys } from "./inspectionKeys";

export function useCompleteMyTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompleteTaskInput }) => completeTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.all });
    },
  });
}
