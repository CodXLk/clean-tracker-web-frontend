import { NextRequest, NextResponse } from "next/server";
import { callBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";
import { REFRESH_COOKIE } from "@/lib/constants";
import { clearAuthCookies } from "@/lib/auth/cookies";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  // Best-effort revocation on the backend so the refresh token can't be reused; never block
  // the client-side sign-out on it.
  if (refreshToken) {
    try {
      await callBackend(BACKEND.auth.logout, { method: "POST", body: { refreshToken }, auth: false });
    } catch {
      // Ignore — cookies are cleared regardless.
    }
  }

  const res = NextResponse.json({ message: "Logged out" }, { status: 200 });
  clearAuthCookies(res);
  return res;
}
