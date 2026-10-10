import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const path = status ? `${BACKEND.leave.list}?status=${encodeURIComponent(status)}` : BACKEND.leave.list;
  return proxyBackend(path, { method: "GET" });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return proxyBackend(BACKEND.leave.create, { method: "POST", body });
}
