import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIX = "/dashboard";
const AUTH_PAGES       = ["/login", "/register"];
const AUTH_COOKIE      = "auth-token";

export function proxy(request: NextRequest) {
  if (process.env.NODE_ENV === "development") return NextResponse.next();

  const { pathname } = request.nextUrl;
  const token        = request.cookies.get(AUTH_COOKIE)?.value;

  const isProtected = pathname.startsWith(PROTECTED_PREFIX);
  const isAuthPage  = AUTH_PAGES.includes(pathname);

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL(PROTECTED_PREFIX, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
