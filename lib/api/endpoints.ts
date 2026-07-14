// Next.js Route Handler paths (called by client components via clientApi, baseURL "/api")
export const ENDPOINTS = {
  auth: {
    login:        "/auth/login",
    logout:       "/auth/logout",
    me:           "/auth/me",
    accountSetup: "/auth/account-setup",
  },
  users: {
    list:        "/users",
    create:      "/users",
    byId:        (id: string) => `/users/${id}`,
    resendSetup: (id: string) => `/users/${id}/resend-setup`,
  },
  companies: {
    list:   "/companies",
    create: "/companies",
    byId:   (id: string) => `/companies/${id}`,
  },
  // Relative to clientApi's "/api" baseURL — these have no Spring Boot backend to
  // mirror, the Next.js route handler *is* the backend, so they live here (not BACKEND).
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

// Spring Boot backend paths (called server-side from Route Handlers)
export const BACKEND = {
  auth: {
    login:        "/api/v1/auth/login",
    me:           "/api/v1/auth/me",
    accountSetup: "/api/v1/auth/account-setup",
    changePassword: "/api/v1/auth/change-password",
  },
  users: {
    list:        "/api/v1/users",
    create:      "/api/v1/users",
    byId:        (id: string) => `/api/v1/users/${id}`,
    resendSetup: (id: string) => `/api/v1/users/${id}/resend-setup`,
  },
  companies: {
    list:   "/api/v1/companies",
    create: "/api/v1/companies",
    byId:   (id: string) => `/api/v1/companies/${id}`,
  },
} as const;
