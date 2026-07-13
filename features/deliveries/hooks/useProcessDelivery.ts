"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { processDelivery } from "@/features/deliveries/services/delivery.service";
import type { ProcessDeliveryInput } from "@/features/deliveries/schemas/delivery.schema";
import { deliveryKeys, inventoryKeys } from "./deliveryKeys";

export function useProcessDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProcessDeliveryInput }) => processDelivery(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.list() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.list() });
    },
  });
}
