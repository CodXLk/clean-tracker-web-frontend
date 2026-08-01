import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/constants";
import { canAccessAdminPath, landingPath, roleFromToken } from "@/lib/auth/roles";

const PROTECTED_PREFIXES = ["/dashboard", "/admin"];
const AUTH_PAGES = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token) {
    const role = roleFromToken(token);

    // Already-authenticated users hitting an auth page go to their role's home.
    if (isAuthPage) {
      return NextResponse.redirect(new URL(landingPath(role), request.url));
    }

    // Keep non-admin roles inside the cleaner app, except where a supervisor is
    // explicitly allowed (e.g. the Cleaner Logs page).
    if (pathname.startsWith("/admin") && !canAccessAdminPath(role, pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
