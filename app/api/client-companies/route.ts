import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function GET() {
  return proxyBackend(BACKEND.clientCompanies.list, { method: "GET" });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyBackend(BACKEND.clientCompanies.create, { method: "POST", body });
}
