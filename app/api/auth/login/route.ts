import { NextRequest, NextResponse } from "next/server";
import { callBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";
import { AUTH_COOKIE } from "@/lib/constants";

interface LoginData {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: { id: string; firstName: string; lastName?: string; email: string; role: string };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await callBackend(BACKEND.auth.login, { method: "POST", body, auth: false });
    const envelope = (result.json ?? {}) as { data?: LoginData; message?: string };

    if (!result.ok || !envelope.data?.accessToken) {
      return NextResponse.json(
        { message: envelope.message ?? "Invalid credentials" },
        { status: result.status || 401 },
      );
    }

    const { accessToken, expiresIn, user } = envelope.data;

    // Return non-sensitive display info; the token is only ever set in an HTTP-only cookie.
    const res = NextResponse.json(
      { user: { id: user.id, name: [user.firstName, user.lastName].filter(Boolean).join(" "), role: user.role } },
      { status: 200 },
    );

    res.cookies.set(AUTH_COOKIE, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.max(60, Math.floor((expiresIn || 86_400_000) / 1000)),
    });

    return res;
  } catch {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
