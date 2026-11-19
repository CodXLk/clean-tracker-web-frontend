"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

// Mirrors backend CertificateWaiverService.WaiverStatus.
export const CertificateWaiverStatusSchema = z.object({
  userId: z.string().uuid(),
  /** Waivers apply to cleaners and supervisors only. */
  applicable: z.boolean(),
  /** Company/super admins may grant, renew or end it. */
  canManage: z.boolean(),
  active: z.boolean(),
  expiresAt: z.string().nullable().optional(),
  waiverDays: z.number(),
  /** Labels of the certificates still missing (mandatory + those their sites/work orders require). */
  missingCertificates: z.array(z.string()).default([]),
  history: z
    .array(
      z.object({
        id: z.string().uuid(),
        grantedAt: z.string(),
        grantedByName: z.string().nullable().optional(),
        expiresAt: z.string(),
        endedAt: z.string().nullable().optional(),
        endedByName: z.string().nullable().optional(),
        note: z.string().nullable().optional(),
        /** ACTIVE / ENDED / EXPIRED */
        status: z.string(),
      }),
    )
    .default([]),
});
export type CertificateWaiverStatus = z.infer<typeof CertificateWaiverStatusSchema>;

const key = (userId: string) => ["certificate-waiver", userId] as const;

export function useCertificateWaiver(userId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: key(userId ?? ""),
    enabled: Boolean(userId) && enabled,
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.users.certificateWaiver(userId as string));
      return CertificateWaiverStatusSchema.parse(data);
    },
  });
}

/** Grant/renew (waive = true, with an optional note) or end (waive = false) a person's waiver. */
export function useSetCertificateWaiver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: string; waive: boolean; note?: string }) => {
      const url = ENDPOINTS.users.certificateWaiver(input.userId);
      const { data } = input.waive
        ? await clientApi.post(url, { note: input.note })
        : await clientApi.delete(url);
      return CertificateWaiverStatusSchema.parse(data);
    },
    onSuccess: (data, input) => {
      qc.setQueryData(key(input.userId), data);
      // Assignment pickers show who is waived.
      qc.invalidateQueries({ queryKey: ["site-eligible"] });
      qc.invalidateQueries({ queryKey: ["work-order-eligible"] });
    },
  });
}
