import type { NextResponse } from "next/server";
import { AUTH_COOKIE, REFRESH_COOKIE } from "@/lib/constants";

/** Refresh cookie is scoped to the auth route handlers that need it. */
export const REFRESH_COOKIE_PATH = "/api/auth";

interface AuthTokens {
  accessToken: string;
  expiresIn: number;
  refreshToken?: string | null;
  refreshExpiresIn?: number | null;
}

const isProd = process.env.NODE_ENV === "production";

/**
 * Write the access (and, when present, refresh) tokens to HTTP-only cookies. The access cookie is
 * kept alive for the refresh window so a full-page navigation still works after the short-lived
 * access JWT has expired — the backend rejects the stale JWT and the client silently refreshes.
 */
export function setAuthCookies(res: NextResponse, tokens: AuthTokens): void {
  const { accessToken, expiresIn, refreshToken, refreshExpiresIn } = tokens;

  const accessMaxAge = Math.max(
    60,
    Math.floor((refreshExpiresIn || expiresIn || 86_400_000) / 1000),
  );

  res.cookies.set(AUTH_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: accessMaxAge,
  });

  if (refreshToken) {
    res.cookies.set(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: REFRESH_COOKIE_PATH,
      maxAge: Math.max(60, Math.floor((refreshExpiresIn || 604_800_000) / 1000)),
    });
  }
}

/** Clear both auth cookies (sign-out or a failed refresh). */
export function clearAuthCookies(res: NextResponse): void {
  res.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  res.cookies.set(REFRESH_COOKIE, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
    maxAge: 0,
  });
}
