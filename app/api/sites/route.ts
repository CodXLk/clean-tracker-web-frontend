import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams.toString();
  const path = params ? `${BACKEND.sites.list}?${params}` : BACKEND.sites.list;
  return proxyBackend(path, { method: "GET" });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyBackend(BACKEND.sites.create, { method: "POST", body });
}
