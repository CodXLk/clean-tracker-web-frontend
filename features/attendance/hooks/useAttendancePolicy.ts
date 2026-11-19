"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

// Mirrors backend AttendanceController.Policy (configured in application.yaml).
export const AttendancePolicySchema = z.object({
  defaultMinimumWorkMinutes: z.number(),
  minimumReviewPercent: z.number(),
  checkInGraceMinutes: z.number(),
  forgotCheckoutGraceMinutes: z.number(),
});
export type AttendancePolicy = z.infer<typeof AttendancePolicySchema>;

export function useAttendancePolicy() {
  return useQuery({
    queryKey: ["attendance", "policy"],
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.attendance.policy);
      return AttendancePolicySchema.parse(data);
    },
    staleTime: 60 * 60 * 1000,
  });
}
