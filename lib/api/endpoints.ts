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
  attendance: {
    mySites:  "/attendance/my-sites",
    checkIn:  "/attendance/check-in",
    checkOut: "/attendance/check-out",
    logs:     "/attendance",
    me:       "/attendance/me",
  },
  tasks: {
    myOccurrences:   "/tasks/my-occurrences",
    complete:        "/tasks/complete",
    reviewComplete:  "/tasks/review-complete",
    photo:           (id: string) => `/tasks/completions/photos/${id}`,
  },
  assignments: {
    create:      "/assignments",
    occurrences: "/assignments/occurrences",
    stats:       "/assignments/stats",
    byId:        (id: string) => `/assignments/${id}`,
    occurrence:  (taskId: string, date: string) => `/assignments/tasks/${taskId}/occurrences/${date}`,
  },
  assignmentDrafts: {
    list:   "/assignment-drafts",
    create: "/assignment-drafts",
    byId:   (id: string) => `/assignment-drafts/${id}`,
  },
  inventory: {
    items:        "/inventory/items",
    itemById:     (id: string) => `/inventory/items/${id}`,
    itemStock:    (id: string) => `/inventory/items/${id}/stock`,
    siteInventory: (siteId: string) => `/inventory/sites/${siteId}`,
    siteAdjust:   (siteId: string) => `/inventory/sites/${siteId}/adjust`,
    lowStock:     "/inventory/low-stock",
    transactions: "/inventory/transactions",
    requests:     "/inventory/requests",
    requestById:  (id: string) => `/inventory/requests/${id}`,
    requestAction: (id: string, action: string) => `/inventory/requests/${id}/${action}`,
    deliveries:   "/inventory/deliveries",
    deliveryById: (id: string) => `/inventory/deliveries/${id}`,
    deliveryAction: (id: string, action: string) => `/inventory/deliveries/${id}/${action}`,
  },
  notifications: {
    list:        "/notifications",
    unreadCount: "/notifications/unread-count",
    read:        (id: string) => `/notifications/${id}/read`,
    readAll:     "/notifications/read-all",
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
    photo:   (id: string) => `/complaints/photos/${id}`,
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
  attendance: {
    mySites:  "/api/v1/attendance/my-sites",
    checkIn:  "/api/v1/attendance/check-in",
    checkOut: "/api/v1/attendance/check-out",
    logs:     "/api/v1/attendance",
    me:       "/api/v1/attendance/me",
  },
  tasks: {
    myOccurrences:   "/api/v1/tasks/my-occurrences",
    complete:        "/api/v1/tasks/complete",
    reviewComplete:  "/api/v1/tasks/review-complete",
    photo:           (id: string) => `/api/v1/tasks/completions/photos/${id}`,
  },
  assignments: {
    create:      "/api/v1/assignments",
    occurrences: "/api/v1/assignments/occurrences",
    stats:       "/api/v1/assignments/stats",
    byId:        (id: string) => `/api/v1/assignments/${id}`,
    occurrence:  (taskId: string, date: string) => `/api/v1/assignments/tasks/${taskId}/occurrences/${date}`,
  },
  assignmentDrafts: {
    list:   "/api/v1/assignment-drafts",
    create: "/api/v1/assignment-drafts",
    byId:   (id: string) => `/api/v1/assignment-drafts/${id}`,
  },
  inventory: {
    items:        "/api/v1/inventory/items",
    itemById:     (id: string) => `/api/v1/inventory/items/${id}`,
    itemStock:    (id: string) => `/api/v1/inventory/items/${id}/stock`,
    siteInventory: (siteId: string) => `/api/v1/inventory/sites/${siteId}`,
    siteAdjust:   (siteId: string) => `/api/v1/inventory/sites/${siteId}/adjust`,
    lowStock:     "/api/v1/inventory/low-stock",
    transactions: "/api/v1/inventory/transactions",
    requests:     "/api/v1/inventory/requests",
    requestById:  (id: string) => `/api/v1/inventory/requests/${id}`,
    requestAction: (id: string, action: string) => `/api/v1/inventory/requests/${id}/${action}`,
    deliveries:   "/api/v1/inventory/deliveries",
    deliveryById: (id: string) => `/api/v1/inventory/deliveries/${id}`,
    deliveryAction: (id: string, action: string) => `/api/v1/inventory/deliveries/${id}/${action}`,
  },
  notifications: {
    list:        "/api/v1/notifications",
    unreadCount: "/api/v1/notifications/unread-count",
    read:        (id: string) => `/api/v1/notifications/${id}/read`,
    readAll:     "/api/v1/notifications/read-all",
  },
  roles: {
    list: "/api/v1/roles",
  },
  complaints: {
    list:    "/api/v1/complaints",
    create:  "/api/v1/complaints",
    resolve: (id: string) => `/api/v1/complaints/${id}/resolve`,
    photo:   (id: string) => `/api/v1/complaints/photos/${id}`,
  },
} as const;
