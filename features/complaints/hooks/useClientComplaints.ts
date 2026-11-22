"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  ClientSiteOptionSchema,
  ComplaintSchema,
  type ClientSiteOption,
  type Complaint,
} from "@/features/complaints/schemas/complaint.schema";
import { complaintKeys } from "./complaintKeys";

/** Client portal: the client's sites with their floors/areas (also used by the work-order form). */
export function useClientSiteOptions(enabled = true) {
  return useQuery<ClientSiteOption[]>({
    queryKey: ["client-portal", "site-options"],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.complaints.clientSites);
      return ClientSiteOptionSchema.array().parse(data);
    },
  });
}

export interface ClientComplaintInput {
  siteId: string;
  floorId?: string;
  areaId?: string;
  description: string;
  photos: File[];
}

/** Client portal: raise a complaint (always critical + high priority on the server). */
export function useCreateClientComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ photos, ...input }: ClientComplaintInput): Promise<Complaint> => {
      const formData = new FormData();
      formData.append(
        "data",
        new Blob(
          [
            JSON.stringify({
              siteId: input.siteId,
              floorId: input.floorId || undefined,
              areaId: input.areaId || undefined,
              description: input.description.trim(),
            }),
          ],
          { type: "application/json" },
        ),
      );
      for (const photo of photos) formData.append("photos", photo);
      const { data } = await clientApi.post(ENDPOINTS.complaints.clientCreate, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return ComplaintSchema.parse(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: complaintKeys.all }),
  });
}

/** Supervisor/management: send a completed complaint back to the cleaners. */
export function useReopenComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }): Promise<Complaint> => {
      const { data } = await clientApi.post(ENDPOINTS.complaints.reopen(id), { note: note?.trim() || undefined });
      return ComplaintSchema.parse(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: complaintKeys.all }),
  });
}

/** Client: feedback on a resolved complaint. */
export function useComplaintFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, feedback, rating }: { id: string; feedback: string; rating?: number }): Promise<Complaint> => {
      const { data } = await clientApi.post(ENDPOINTS.complaints.feedback(id), { feedback: feedback.trim(), rating });
      return ComplaintSchema.parse(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: complaintKeys.all }),
  });
}