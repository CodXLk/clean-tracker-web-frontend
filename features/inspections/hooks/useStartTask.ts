"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startTask } from "@/features/inspections/services/inspection.service";
import { inspectionKeys } from "./inspectionKeys";

export function useStartTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => startTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.all });
    },
  });
}
