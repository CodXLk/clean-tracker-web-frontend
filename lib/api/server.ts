// ⚠️ NEVER import this file in any "use client" component
import axios from "axios";
import { serverEnv } from "@/lib/env";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const serverApi = axios.create({
  baseURL: serverEnv.SPRING_BOOT_API_URL,
  headers: {
    "Content-Type": "application/json",
    "x-api-key":    serverEnv.SPRING_BOOT_API_KEY,
  },
  timeout: 10_000,
});

serverApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status  = error.response?.status;
    const message = error.response?.data?.message ?? "An unexpected error occurred";
    throw new ApiError(status ?? 500, message);
  },
);
