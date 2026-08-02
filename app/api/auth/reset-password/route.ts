import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

// Public endpoint — sets a new password using a valid reset OTP.
export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyBackend(BACKEND.auth.resetPassword, { method: "POST", body, auth: false });
}
