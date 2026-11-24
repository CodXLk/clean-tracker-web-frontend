import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

/** Which phone push categories the current user receives (only those relevant to their role). */
export async function GET() {
  return proxyBackend(BACKEND.notifications.pushPreferences, { method: "GET" });
}

/** Mute push categories: body `{ mutedCategories: string[] }`. */
export async function PUT(request: NextRequest) {
  const body = await request.json();
  return proxyBackend(BACKEND.notifications.pushPreferences, { method: "PUT", body });
}