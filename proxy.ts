import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/constants";
import { landingPath, roleFromToken, isSupervisorRouteAllowed } from "@/lib/auth/roles";

const PROTECTED_PREFIXES = ["/dashboard", "/admin"];
const AUTH_PAGES = ["/login", "/register"];
const SELECT_ROLE_PATH = "/select-role";

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

    // A token with no active-role claim is a "pending" token: the user authenticated but has
    // multiple roles and hasn't chosen one yet. Keep them on the role-selection screen until
    // they activate a role — they must not reach any protected area with an unresolved role.
    const pendingRoleSelection = role === null;
    if (pendingRoleSelection) {
      if (pathname === SELECT_ROLE_PATH) return NextResponse.next();
      if (isProtected || isAuthPage) {
        return NextResponse.redirect(new URL(SELECT_ROLE_PATH, request.url));
      }
      return NextResponse.next();
    }

    // Already-authenticated users hitting an auth page go to their role's home. The role-selection
    // screen stays reachable so a multi-role user can switch roles after logging in.
    if (isAuthPage) {
      return NextResponse.redirect(new URL(landingPath(role), request.url));
    }

    // Supervisors only get a fixed subset of Admin Panel sections — block direct
    // navigation to anything else, not just hide it from the nav (AppNav.tsx).
    if (isProtected && role === "SUPERVISOR" && !isSupervisorRouteAllowed(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
