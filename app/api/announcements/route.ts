import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function GET(request: NextRequest) {
  return proxyBackend(`${BACKEND.announcements.list}${request.nextUrl.search}`, { method: "GET" });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return proxyBackend(BACKEND.announcements.create, { method: "POST", body });
}
