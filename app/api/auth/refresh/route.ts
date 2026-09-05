import { NextRequest, NextResponse } from "next/server";
import { callBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";
import { REFRESH_COOKIE } from "@/lib/constants";
import { setAuthCookies, clearAuthCookies } from "@/lib/auth/cookies";

interface AuthData {
  accessToken: string;
  expiresIn: number;
  refreshToken?: string | null;
  refreshExpiresIn?: number | null;
  user: { id: string; firstName: string; lastName?: string; email: string; role: string; roles?: string[] };
}

/**
 * Exchange the HTTP-only refresh cookie for a new access + refresh token. The backend rotates the
 * refresh token and re-verifies the active role, so a revoked role or a deactivated account fails
 * here and the session is cleared.
 */
export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  const fail = (status: number, message: string) => {
    const res = NextResponse.json({ message }, { status });
    clearAuthCookies(res);
    return res;
  };

  if (!refreshToken) {
    return fail(401, "Your session has expired. Please sign in again.");
  }

  try {
    const result = await callBackend(BACKEND.auth.refresh, {
      method: "POST",
      body: { refreshToken },
      auth: false,
    });
    const envelope = (result.json ?? {}) as { data?: AuthData; message?: string };

    if (!result.ok || !envelope.data?.accessToken) {
      return fail(401, envelope.message ?? "Your session has expired. Please sign in again.");
    }

    const { accessToken, expiresIn, refreshToken: newRefresh, refreshExpiresIn, user } = envelope.data;

    const res = NextResponse.json(
      { user: { id: user.id, name: [user.firstName, user.lastName].filter(Boolean).join(" "), role: user.role } },
      { status: 200 },
    );
    setAuthCookies(res, { accessToken, expiresIn, refreshToken: newRefresh, refreshExpiresIn });
    return res;
  } catch {
    return fail(502, "Couldn't reach the authentication service.");
  }
}
