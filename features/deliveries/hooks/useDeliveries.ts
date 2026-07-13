"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDeliveries } from "@/features/deliveries/services/delivery.service";
import { deliveryKeys } from "./deliveryKeys";

export function useDeliveries() {
  return useQuery({
    queryKey: deliveryKeys.list(),
    queryFn:  fetchDeliveries,
  });
}
