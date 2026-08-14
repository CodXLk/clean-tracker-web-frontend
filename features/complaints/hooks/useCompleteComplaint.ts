"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { completeComplaint } from "@/features/complaints/services/complaint.service";
import { complaintKeys } from "./complaintKeys";

interface CompleteComplaintVars {
  id: string;
  note?: string;
  photos?: File[];
}

/** Cleaner completes a complaint (redo) with photos/note; moves it to CLOSED for review. */
export function useCompleteComplaint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, note, photos }: CompleteComplaintVars) =>
      completeComplaint(id, note, photos ?? []),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complaintKeys.list() });
    },
  });
}
