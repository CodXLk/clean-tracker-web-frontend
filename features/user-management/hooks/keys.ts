export const clientCompanyKeys = {
  all: ["client-companies"] as const,
  lists: () => [...clientCompanyKeys.all, "list"] as const,
  detail: (id: string) => [...clientCompanyKeys.all, "detail", id] as const,
};

export const clientKeys = {
  all: ["clients"] as const,
  lists: () => [...clientKeys.all, "list"] as const,
  list: (companyId: string | undefined) => [...clientKeys.lists(), companyId ?? "all"] as const,
  detail: (id: string) => [...clientKeys.all, "detail", id] as const,
};

export const siteKeys = {
  all: ["sites"] as const,
  lists: () => [...siteKeys.all, "list"] as const,
  detail: (id: string) => [...siteKeys.all, "detail", id] as const,
};
