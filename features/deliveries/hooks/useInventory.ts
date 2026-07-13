"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchInventory } from "@/features/deliveries/services/delivery.service";
import { inventoryKeys } from "./deliveryKeys";

export function useInventory() {
  return useQuery({
    queryKey: inventoryKeys.list(),
    queryFn:  fetchInventory,
  });
}
