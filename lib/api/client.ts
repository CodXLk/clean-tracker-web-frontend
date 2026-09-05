// Safe for Client Components — calls Next.js Route Handlers, NOT Spring Boot directly
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { ENDPOINTS } from "./endpoints";

export const clientApi = axios.create({
  baseURL:         "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Requests that must never trigger a refresh attempt (they *are* the auth handshake).
const AUTH_FREE_PATHS = [
  ENDPOINTS.auth.refresh,
  ENDPOINTS.auth.login,
  ENDPOINTS.auth.selectRole,
  ENDPOINTS.auth.logout,
];

// Single-flight refresh: concurrent 401s share one refresh call instead of stampeding.
let refreshPromise: Promise<void> | null = null;

function runRefresh(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = clientApi
      .post(ENDPOINTS.auth.refresh)
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// On a 401, silently refresh the access token once and retry the original request. If the refresh
// itself fails (expired/revoked session, or an active role that was removed), send the user to login.
clientApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;
    const url = original?.url ?? "";
    const isAuthFree = AUTH_FREE_PATHS.some((p) => url.includes(p));

    if (status === 401 && original && !original._retried && !isAuthFree) {
      original._retried = true;
      try {
        await runRefresh();
        return clientApi(original);
      } catch {
        if (typeof window !== "undefined") {
          const callback = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `/login?callbackUrl=${callback}`;
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);
