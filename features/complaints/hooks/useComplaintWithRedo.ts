"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addComplaintRedo, createComplaint } from "@/features/complaints/services/complaint.service";
import type { CreateComplaintInput } from "@/features/complaints/schemas/complaint.schema";
import { complaintKeys } from "./complaintKeys";

/**
 * Raise a complaint against task occurrences and immediately schedule redo task(s)
 * into the site's next working shift. The backend auto-detects the next shift date
 * and its assigned cleaner(s) for the relevant floor/area.
 */
export function useComplaintWithRedo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ input, photos }: { input: CreateComplaintInput; photos?: File[] }) => {
      const complaint = await createComplaint(input, photos ?? []);
      await addComplaintRedo(complaint.id);
      return complaint;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complaintKeys.list() });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
