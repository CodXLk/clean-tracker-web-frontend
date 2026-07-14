export const assignmentKeys = {
  all: ["task-assignments"] as const,
  lists: () => [...assignmentKeys.all, "list"] as const,
  list: (range: string | undefined) => [...assignmentKeys.lists(), range ?? "all"] as const,
  detail: (id: string) => [...assignmentKeys.all, "detail", id] as const,
  stats: () => [...assignmentKeys.all, "stats"] as const,
};
