import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward to Spring Boot
    const response = await fetch(
      `${process.env.SPRING_BOOT_API_URL}/api/auth/login`,
      {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key":    process.env.SPRING_BOOT_API_KEY ?? "",
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { message: error.message ?? "Invalid credentials" },
        { status: response.status },
      );
    }

    const data = await response.json();
    const res  = NextResponse.json({ message: "Login successful" }, { status: 200 });

    res.cookies.set(AUTH_COOKIE, data.accessToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      path:     "/",
      maxAge:   15 * 60, // 15 minutes
    });

    if (data.refreshToken) {
      res.cookies.set("refresh-token", data.refreshToken, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === "production",
        sameSite: "lax",
        path:     "/api/auth/refresh",
        maxAge:   7 * 24 * 60 * 60, // 7 days
      });
    }

    return res;
  } catch {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
