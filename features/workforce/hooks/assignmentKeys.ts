export const assignmentKeys = {
  all: ["assignments"] as const,
  occurrences: () => [...assignmentKeys.all, "occurrences"] as const,
  occurrenceRange: (range: string | undefined, siteId: string | undefined) =>
    [...assignmentKeys.occurrences(), range ?? "all", siteId ?? "all-sites"] as const,
  detail: (id: string) => [...assignmentKeys.all, "detail", id] as const,
  stats: () => [...assignmentKeys.all, "stats"] as const,
  taskNames: () => [...assignmentKeys.all, "task-names"] as const,
};
