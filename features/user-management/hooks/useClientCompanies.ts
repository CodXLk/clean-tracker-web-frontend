"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  ClientCompanyListSchema,
  ClientCompanySchema,
  type ClientCompany,
  type ClientCompanyFormInput,
} from "@/features/user-management/schemas/clientCompany.schema";
import { clientCompanyKeys, clientKeys, siteKeys } from "./keys";

function toPayload(input: ClientCompanyFormInput): Record<string, unknown> {
  const payload: Record<string, unknown> = { name: input.name.trim() };
  if (input.contactNumber) payload.contactNumber = input.contactNumber.trim();
  if (input.email) payload.email = input.email.trim();
  return payload;
}

async function fetchClientCompanies(): Promise<ClientCompany[]> {
  const { data } = await clientApi.get(ENDPOINTS.clientCompanies.list);
  return ClientCompanyListSchema.parse(data);
}

export function useClientCompanies() {
  return useQuery({
    queryKey: clientCompanyKeys.lists(),
    queryFn: fetchClientCompanies,
  });
}

export function useCreateClientCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClientCompanyFormInput) => {
      const { data } = await clientApi.post(ENDPOINTS.clientCompanies.create, toPayload(input));
      return ClientCompanySchema.parse(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientCompanyKeys.lists() }),
  });
}

export function useUpdateClientCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ClientCompanyFormInput }) => {
      const { data } = await clientApi.put(ENDPOINTS.clientCompanies.byId(id), toPayload(input));
      return ClientCompanySchema.parse(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientCompanyKeys.lists() }),
  });
}

export function useDeleteClientCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await clientApi.delete(ENDPOINTS.clientCompanies.byId(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientCompanyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      queryClient.invalidateQueries({ queryKey: siteKeys.all });
    },
  });
}
