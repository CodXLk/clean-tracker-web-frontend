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
  // Relative to clientApi's "/api" baseURL (unlike auth/users above, these have
  // no Spring Boot backend to mirror — the Next.js route handler *is* the backend).
  inspections: {
    list:         "/inspections",
    startTask:    (id: string) => `/inspections/tasks/${id}/start`,
    completeTask: (id: string) => `/inspections/tasks/${id}/complete`,
    completeArea: (id: string) => `/inspections/areas/${id}/complete`,
  },
  complaints: {
    list:    "/complaints",
    create:  "/complaints",
    resolve: (id: string) => `/complaints/${id}/resolve`,
  },
  deliveries: {
    list:    "/deliveries",
    process: (id: string) => `/deliveries/${id}/process`,
  },
  inventory: {
    list: "/inventory",
  },
  contact: {
    submit: "/contact",
  },
} as const;
