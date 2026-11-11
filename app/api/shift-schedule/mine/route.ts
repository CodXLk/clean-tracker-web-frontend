import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from") ?? "";
  const to = request.nextUrl.searchParams.get("to") ?? "";
  const qs = new URLSearchParams({ from, to }).toString();
  return proxyBackend(`${BACKEND.shiftSchedule.mine}?${qs}`, { method: "GET" });
}
