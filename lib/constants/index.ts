export const ROUTES = {
  HOME:      "/",
  LOGIN:     "/login",
  REGISTER:  "/register",
  DASHBOARD: "/dashboard",
  SETTINGS:  "/dashboard/settings",
} as const;

export const AUTH_COOKIE     = "auth-token";
export const REFRESH_COOKIE  = "refresh-token";

export const PAGINATION_DEFAULT_PAGE = 0;
export const PAGINATION_DEFAULT_SIZE = 10;

export const API_TIMEOUT = 10_000;
