"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  SiteListSchema,
  SiteSchema,
  type Site,
  type SiteFormInput,
} from "@/features/user-management/schemas/site.schema";
import { areaKeys, floorKeys, siteKeys } from "./keys";

function toPayload(input: SiteFormInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    clientCompanyId: input.clientCompanyId,
    clientId: input.clientId,
    name: input.name.trim(),
  };
  if (input.contactPersonName) payload.contactPersonName = input.contactPersonName.trim();
  if (input.contactNumber) payload.contactNumber = input.contactNumber.trim();
  if (input.googleMapsLink) payload.googleMapsLink = input.googleMapsLink.trim();
  if (input.streetAddress) payload.streetAddress = input.streetAddress.trim();
  if (input.startDate) payload.startDate = input.startDate;
  if (input.endDate) payload.endDate = input.endDate;
  payload.workingDays = input.workingDays ?? [];
  return payload;
}

async function fetchSites(): Promise<Site[]> {
  const { data } = await clientApi.get(ENDPOINTS.sites.list);
  return SiteListSchema.parse(data);
}

export function useSites() {
  return useQuery({
    queryKey: siteKeys.lists(),
    queryFn: fetchSites,
  });
}

export function useCreateSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SiteFormInput) => {
      const { data } = await clientApi.post(ENDPOINTS.sites.create, toPayload(input));
      return SiteSchema.parse(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: siteKeys.lists() }),
  });
}

export function useUpdateSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: SiteFormInput }) => {
      const { data } = await clientApi.put(ENDPOINTS.sites.byId(id), toPayload(input));
      return SiteSchema.parse(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: siteKeys.lists() }),
  });
}

export function useDeleteSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await clientApi.delete(ENDPOINTS.sites.byId(id));
    },
    // Deleting a site cascades conceptually to its floors and areas — the backend blocks
    // the delete while floors exist, but keep both lists fresh regardless.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: siteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: floorKeys.all });
      queryClient.invalidateQueries({ queryKey: areaKeys.all });
    },
  });
}
