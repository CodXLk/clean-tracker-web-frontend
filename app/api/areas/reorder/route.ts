import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function PUT(request: NextRequest) {
  const body = await request.json();
  return proxyBackend(BACKEND.areas.reorder, { method: "PUT", body });
}
