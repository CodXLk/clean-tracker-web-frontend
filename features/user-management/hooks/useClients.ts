"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  ClientListSchema,
  ClientSchema,
  type Client,
  type ClientFormInput,
} from "@/features/user-management/schemas/client.schema";
import { userKeys } from "@/features/users/hooks/userKeys";
import { clientKeys, siteKeys } from "./keys";

function toPayload(input: ClientFormInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    clientCompanyId: input.clientCompanyId,
    name: input.name.trim(),
  };
  if (input.contactNumber) payload.contactNumber = input.contactNumber.trim();
  if (input.email) payload.email = input.email.trim();
  return payload;
}

async function fetchClients(companyId?: string): Promise<Client[]> {
  const { data } = await clientApi.get(ENDPOINTS.clients.list, {
    params: companyId ? { clientCompanyId: companyId } : undefined,
  });
  return ClientListSchema.parse(data);
}

/** List clients. Pass a companyId to load only that client-company's clients. */
export function useClients(companyId?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: clientKeys.list(companyId),
    queryFn: () => fetchClients(companyId),
    enabled: options?.enabled ?? true,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClientFormInput) => {
      const { data } = await clientApi.post(ENDPOINTS.clients.create, toPayload(input));
      return ClientSchema.parse(data);
    },
    // Creating a client also provisions a CLIENT-role user, so the Users list may be stale too.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ClientFormInput }) => {
      const { data } = await clientApi.put(ENDPOINTS.clients.byId(id), toPayload(input));
      return ClientSchema.parse(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientKeys.all }),
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await clientApi.delete(ENDPOINTS.clients.byId(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      queryClient.invalidateQueries({ queryKey: siteKeys.all });
    },
  });
}
