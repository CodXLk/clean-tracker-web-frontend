import { NextRequest, NextResponse } from "next/server";
import { callBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";
import { setAuthCookies } from "@/lib/auth/cookies";

interface AuthData {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken?: string | null;
  refreshExpiresIn?: number | null;
  user: { id: string; firstName: string; lastName?: string; email: string; role: string; roles?: string[] };
}

/**
 * Activate one of the authenticated user's assigned roles. Forwards the pending (or current)
 * token from the cookie; the backend re-verifies the requested role against the user's persisted
 * assignments and returns a fresh role-scoped access + refresh token, which we swap into cookies.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await callBackend(BACKEND.auth.selectRole, { method: "POST", body });
    const envelope = (result.json ?? {}) as { data?: AuthData; message?: string };

    if (!result.ok || !envelope.data?.accessToken) {
      const message =
        envelope.message ??
        (result.status === 401 || result.status === 403
          ? "You are not allowed to use that role."
          : "We couldn't activate that role. Please try again.");
      return NextResponse.json({ message }, { status: result.status || 400 });
    }

    const { accessToken, expiresIn, refreshToken, refreshExpiresIn, user } = envelope.data;

    const res = NextResponse.json(
      { user: { id: user.id, name: [user.firstName, user.lastName].filter(Boolean).join(" "), role: user.role } },
      { status: 200 },
    );

    setAuthCookies(res, { accessToken, expiresIn, refreshToken, refreshExpiresIn });

    return res;
  } catch {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
