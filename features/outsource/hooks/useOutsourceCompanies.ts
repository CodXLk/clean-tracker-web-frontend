"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  OutsourceCompanyListSchema,
  OutsourceCompanySchema,
  type OutsourceCompanyInput,
} from "@/features/outsource/schemas/outsourceCompany.schema";

const keys = { all: ["outsource-companies"] as const };

export function useOutsourceCompanies(enabled = true) {
  return useQuery({
    queryKey: keys.all,
    enabled,
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.outsourceCompanies.list);
      return OutsourceCompanyListSchema.parse(data);
    },
  });
}

export function useCreateOutsourceCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: OutsourceCompanyInput) => {
      const { data } = await clientApi.post(ENDPOINTS.outsourceCompanies.create, input);
      return OutsourceCompanySchema.parse(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useDeleteOutsourceCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await clientApi.delete(ENDPOINTS.outsourceCompanies.byId(id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}
