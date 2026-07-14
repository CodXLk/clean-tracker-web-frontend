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

export const floorKeys = {
  all: ["floors"] as const,
  lists: () => [...floorKeys.all, "list"] as const,
  list: (siteId: string | undefined) => [...floorKeys.lists(), siteId ?? "all"] as const,
  detail: (id: string) => [...floorKeys.all, "detail", id] as const,
};

export const areaKeys = {
  all: ["areas"] as const,
  lists: () => [...areaKeys.all, "list"] as const,
  list: (floorId: string | undefined) => [...areaKeys.lists(), floorId ?? "all"] as const,
  detail: (id: string) => [...areaKeys.all, "detail", id] as const,
};
