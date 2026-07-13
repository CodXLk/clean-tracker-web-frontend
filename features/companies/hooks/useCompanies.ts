"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  CompanyListSchema,
  CompanySchema,
  type Company,
  type CreateCompanyInput,
} from "@/features/companies/schemas/company.schema";
import { companyKeys } from "./companyKeys";

async function fetchCompanies(): Promise<Company[]> {
  const { data } = await clientApi.get(ENDPOINTS.companies.list);
  return CompanyListSchema.parse(data);
}

export function useCompanies() {
  return useQuery({
    queryKey: companyKeys.lists(),
    queryFn: fetchCompanies,
  });
}

async function createCompany(input: CreateCompanyInput): Promise<Company> {
  const payload: Record<string, unknown> = { name: input.name };
  for (const key of ["contactEmail", "contactPhone", "addressLine", "city", "state", "postcode"] as const) {
    if (input[key]) payload[key] = input[key];
  }
  const { data } = await clientApi.post(ENDPOINTS.companies.create, payload);
  return CompanySchema.parse(data);
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCompany,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: companyKeys.lists() }),
  });
}
