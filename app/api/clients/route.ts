import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get("clientCompanyId");
  const path = companyId ? BACKEND.clients.byCompany(companyId) : BACKEND.clients.list;
  return proxyBackend(path, { method: "GET" });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyBackend(BACKEND.clients.create, { method: "POST", body });
}
