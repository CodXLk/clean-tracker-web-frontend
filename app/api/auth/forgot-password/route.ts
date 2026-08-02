import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

// Public endpoint — sends a reset OTP if the email matches an account.
export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyBackend(BACKEND.auth.forgotPassword, { method: "POST", body, auth: false });
}
