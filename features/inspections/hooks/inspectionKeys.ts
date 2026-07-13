export const inspectionKeys = {
  all:  ["inspections"]                as const,
  list: () => [...inspectionKeys.all, "list"] as const,
};
