import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

// Authenticated endpoint — changes the current user's password. Forwards the auth cookie.
export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyBackend(BACKEND.auth.changePassword, { method: "POST", body, auth: true });
}
