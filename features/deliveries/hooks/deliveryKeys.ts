export const deliveryKeys = {
  all:  ["deliveries"]                as const,
  list: () => [...deliveryKeys.all, "list"] as const,
};

export const inventoryKeys = {
  all:  ["inventory"]                 as const,
  list: () => [...inventoryKeys.all, "list"] as const,
};
