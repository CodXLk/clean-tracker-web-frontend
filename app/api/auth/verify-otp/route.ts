import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

// Public endpoint — validates a reset OTP before allowing a password change.
export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyBackend(BACKEND.auth.verifyOtp, { method: "POST", body, auth: false });
}
