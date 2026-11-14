import { type NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function GET(request: NextRequest) {
  return proxyBackend(`${BACKEND.notifications.list}${request.nextUrl.search}`, { method: "GET" });
}
