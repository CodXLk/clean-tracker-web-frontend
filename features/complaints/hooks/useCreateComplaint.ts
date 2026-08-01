"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createComplaint } from "@/features/complaints/services/complaint.service";
import type { CreateComplaintInput } from "@/features/complaints/schemas/complaint.schema";
import { complaintKeys } from "./complaintKeys";

export function useCreateComplaint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, photos }: { input: CreateComplaintInput; photos?: File[] }) =>
      createComplaint(input, photos ?? []),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complaintKeys.list() });
    },
  });
}
