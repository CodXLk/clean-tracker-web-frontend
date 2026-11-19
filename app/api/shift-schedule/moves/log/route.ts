import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function GET(request: NextRequest) {
  const qs = new URLSearchParams();
  for (const key of ["siteId", "cleanerId", "from", "to"]) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) qs.set(key, value);
  }
  const query = qs.toString();
  return proxyBackend(`${BACKEND.shiftSchedule.moveLog}${query ? `?${query}` : ""}`, { method: "GET" });
}
