"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { UserSchema, type UpdateUserInput, type User } from "@/features/users/schemas/user.schema";
import { cleanerKeys } from "@/features/cleaners/hooks/useCleaners";
import { siteAssignmentKeys } from "@/features/user-management/hooks/useSiteAssignments";
import { assignmentKeys } from "@/features/workforce/hooks/assignmentKeys";
import { attendanceKeys } from "@/features/attendance/hooks/useAttendance";
import { userKeys } from "./userKeys";

/** Updates a user's basic details (first/last name, phone) — a user is always allowed
 *  to update their own record, regardless of role, per backend authorization rules. */
export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateUserInput }): Promise<User> => {
      const { data } = await clientApi.put(ENDPOINTS.users.byId(id), input);
      return UserSchema.parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      // Supervisor-facing views (Cleaner Logs, Workforce Calendar, site cleaner
      // pickers) read a cleaner's name from separate endpoints/caches — refresh
      // those too so an already-open supervisor session picks up the change.
      queryClient.invalidateQueries({ queryKey: cleanerKeys.all });
      queryClient.invalidateQueries({ queryKey: siteAssignmentKeys.all });
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await clientApi.delete(ENDPOINTS.users.byId(id));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.lists() }),
  });
}

export function useResendSetup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await clientApi.post(ENDPOINTS.users.resendSetup(id));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.lists() }),
  });
}
