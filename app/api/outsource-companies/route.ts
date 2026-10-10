import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function GET() {
  return proxyBackend(BACKEND.outsourceCompanies.list, { method: "GET" });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return proxyBackend(BACKEND.outsourceCompanies.create, { method: "POST", body });
}
