"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchInspections } from "@/features/inspections/services/inspection.service";
import { inspectionKeys } from "./inspectionKeys";

export function useInspections() {
  return useQuery({
    queryKey: inspectionKeys.list(),
    queryFn:  fetchInspections,
  });
}
