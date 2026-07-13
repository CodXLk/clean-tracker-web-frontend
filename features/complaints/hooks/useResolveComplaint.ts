"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resolveComplaint } from "@/features/complaints/services/complaint.service";
import { complaintKeys } from "./complaintKeys";

export function useResolveComplaint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => resolveComplaint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complaintKeys.list() });
    },
  });
}
