import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

// Supervisor: close out an inspection via rating or a linked complaint (JSON body).
export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyBackend(BACKEND.tasks.inspect, { method: "POST", body });
}
