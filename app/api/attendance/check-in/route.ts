import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyBackend(BACKEND.attendance.checkIn, { method: "POST", body });
}
