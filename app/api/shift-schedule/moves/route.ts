import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return proxyBackend(BACKEND.shiftSchedule.move, { method: "POST", body });
}
