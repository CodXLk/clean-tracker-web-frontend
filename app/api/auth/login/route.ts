import { NextRequest, NextResponse } from "next/server";
import { callBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";
import { setAuthCookies } from "@/lib/auth/cookies";

interface LoginData {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken?: string | null;
  refreshExpiresIn?: number | null;
  user: { id: string; firstName: string; lastName?: string; email: string; role: string; roles?: string[] };
  requiresRoleSelection?: boolean;
  availableRoles?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await callBackend(BACKEND.auth.login, { method: "POST", body, auth: false });
    const envelope = (result.json ?? {}) as { data?: LoginData; message?: string };

    if (!result.ok || !envelope.data?.accessToken) {
      const message =
        envelope.message ??
        (result.status === 401
          ? "Invalid email or password."
          : "We couldn't sign you in right now. Please try again in a moment.");
      return NextResponse.json({ message }, { status: result.status || 401 });
    }

    const { accessToken, expiresIn, refreshToken, refreshExpiresIn, user, requiresRoleSelection, availableRoles } =
      envelope.data;

    // Return non-sensitive display info; tokens are only ever set in HTTP-only cookies.
    // When role selection is required the cookie holds a "pending" token (no refresh token yet)
    // that only permits /auth/select-role and /auth/me until a role is activated.
    const res = NextResponse.json(
      {
        user: { id: user.id, name: [user.firstName, user.lastName].filter(Boolean).join(" "), role: user.role },
        requiresRoleSelection: !!requiresRoleSelection,
        availableRoles: availableRoles ?? [],
      },
      { status: 200 },
    );

    setAuthCookies(res, { accessToken, expiresIn, refreshToken, refreshExpiresIn });

    return res;
  } catch {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
