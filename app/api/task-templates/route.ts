import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function GET() {
  return proxyBackend(BACKEND.taskTemplates.list, { method: "GET" });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyBackend(BACKEND.taskTemplates.create, { method: "POST", body });
}
