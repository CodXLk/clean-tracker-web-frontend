// Safe for Client Components — calls Next.js Route Handlers, NOT Spring Boot directly
import axios from "axios";

export const clientApi = axios.create({
  baseURL:         "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});
