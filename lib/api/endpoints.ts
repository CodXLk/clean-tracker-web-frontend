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
  clientCompanies: {
    list:   "/client-companies",
    create: "/client-companies",
    byId:   (id: string) => `/client-companies/${id}`,
  },
  clients: {
    list:   "/clients",
    create: "/clients",
    byId:   (id: string) => `/clients/${id}`,
  },
  sites: {
    list:   "/sites",
    create: "/sites",
    byId:   (id: string) => `/sites/${id}`,
    supervisors: (id: string) => `/sites/${id}/supervisors`,
    cleaners:    (id: string) => `/sites/${id}/cleaners`,
  },
  floors: {
    list:   "/floors",
    create: "/floors",
    byId:   (id: string) => `/floors/${id}`,
  },
  areas: {
    list:   "/areas",
    create: "/areas",
    byId:   (id: string) => `/areas/${id}`,
  },
  cleaners: {
    list: "/cleaners",
    byId: (id: string) => `/cleaners/${id}`,
  },
  assignments: {
    create:      "/assignments",
    occurrences: "/assignments/occurrences",
    stats:       "/assignments/stats",
    byId:        (id: string) => `/assignments/${id}`,
    occurrence:  (taskId: string, date: string) => `/assignments/tasks/${taskId}/occurrences/${date}`,
  },
  roles: {
    list: "/roles",
  },
  // These have no Spring Boot backend to mirror — the Next.js route handler *is*
  // the backend. Consumed by client components via clientApi ("/api" baseURL).
  inspections: {
    list:         "/inspections",
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
  clientCompanies: {
    list:   "/api/v1/client-companies",
    create: "/api/v1/client-companies",
    byId:   (id: string) => `/api/v1/client-companies/${id}`,
  },
  clients: {
    list:   "/api/v1/clients",
    create: "/api/v1/clients",
    byId:   (id: string) => `/api/v1/clients/${id}`,
    byCompany: (companyId: string) => `/api/v1/clients?clientCompanyId=${companyId}`,
  },
  sites: {
    list:   "/api/v1/sites",
    create: "/api/v1/sites",
    byId:   (id: string) => `/api/v1/sites/${id}`,
    supervisors: (id: string) => `/api/v1/sites/${id}/supervisors`,
    cleaners:    (id: string) => `/api/v1/sites/${id}/cleaners`,
  },
  floors: {
    list:   "/api/v1/floors",
    create: "/api/v1/floors",
    byId:   (id: string) => `/api/v1/floors/${id}`,
  },
  areas: {
    list:   "/api/v1/areas",
    create: "/api/v1/areas",
    byId:   (id: string) => `/api/v1/areas/${id}`,
  },
  cleaners: {
    list: "/api/v1/cleaners",
    byId: (id: string) => `/api/v1/cleaners/${id}`,
  },
  assignments: {
    create:      "/api/v1/assignments",
    occurrences: "/api/v1/assignments/occurrences",
    stats:       "/api/v1/assignments/stats",
    byId:        (id: string) => `/api/v1/assignments/${id}`,
    occurrence:  (taskId: string, date: string) => `/api/v1/assignments/tasks/${taskId}/occurrences/${date}`,
  },
  roles: {
    list: "/api/v1/roles",
  },
} as const;
