export const complaintKeys = {
  all:  ["complaints"]                as const,
  list: () => [...complaintKeys.all, "list"] as const,
};
