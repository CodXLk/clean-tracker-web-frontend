export const userKeys = {
  all:    ["users"]                                             as const,
  lists:  () => [...userKeys.all, "list"]                       as const,
  list:   (filters: object) => [...userKeys.lists(), filters]   as const,
  detail: (id: string) => [...userKeys.all, "detail", id]       as const,
};
