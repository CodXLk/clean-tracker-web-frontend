"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  CertificateOptionListSchema,
  CERTIFICATE_TYPE_LABELS,
  type CertificateOption,
} from "@/features/users/schemas/document.schema";

const certificateTypeKeys = {
  all: ["certificate-types"] as const,
};

/** The full certificate catalog (built-in + custom types) from the backend. */
export function useCertificateTypes() {
  return useQuery<CertificateOption[]>({
    queryKey: certificateTypeKeys.all,
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.certificateTypes.list);
      return CertificateOptionListSchema.parse(data);
    },
    staleTime: 5 * 60_000,
  });
}

/** A key -> label resolver over the catalog, falling back to built-in labels then the key itself. */
export function useCertificateLabels() {
  const { data } = useCertificateTypes();
  return useMemo(() => {
    const map = new Map<string, string>();
    for (const opt of data ?? []) map.set(opt.key, opt.label);
    return (key: string): string =>
      map.get(key) ??
      (CERTIFICATE_TYPE_LABELS as Record<string, string>)[key] ??
      key;
  }, [data]);
}

/** Create a new custom certificate type. */
export function useCreateCertificateType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (label: string) => {
      const { data } = await clientApi.post(ENDPOINTS.certificateTypes.create, { label });
      return data as CertificateOption;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: certificateTypeKeys.all }),
  });
}
