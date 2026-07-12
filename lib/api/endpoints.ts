export const ENDPOINTS = {
  auth: {
    login:   "/api/auth/login",
    logout:  "/api/auth/logout",
    refresh: "/api/auth/refresh",
    me:      "/api/auth/me",
  },
  users: {
    list:   "/api/users",
    byId:   (id: string) => `/api/users/${id}`,
    create: "/api/users",
    update: (id: string) => `/api/users/${id}`,
    delete: (id: string) => `/api/users/${id}`,
  },
} as const;
