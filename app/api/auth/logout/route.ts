import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/constants";

export async function POST() {
  const res = NextResponse.json({ message: "Logged out" }, { status: 200 });

  res.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    path:     "/",
    maxAge:   0,
  });

  res.cookies.set("refresh-token", "", {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    path:     "/api/auth/refresh",
    maxAge:   0,
  });

  return res;
}
