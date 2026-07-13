"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { completeArea } from "@/features/inspections/services/inspection.service";
import type { CompleteTaskInput } from "@/features/inspections/schemas/inspection.schema";
import { inspectionKeys } from "./inspectionKeys";

export function useCompleteAreaInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompleteTaskInput }) => completeArea(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.all });
    },
  });
}
