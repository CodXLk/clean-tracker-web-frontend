import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/constants";

/** Forwards a multipart form (JSON `data` part + file parts) to the Spring backend and unwraps its envelope. */
export async function proxyMultipart(request: NextRequest, path: string): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const headers: Record<string, string> = { "x-api-key": process.env.SPRING_BOOT_API_KEY ?? "" };
    const token = (await cookies()).get(AUTH_COOKIE)?.value;
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${process.env.SPRING_BOOT_API_URL}${path}`, {
      method: "POST",
      headers, // no Content-Type — fetch sets the multipart boundary from the body
      body: formData,
      cache: "no-store",
    });
    let json: unknown = null;
    const text = await response.text();
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = { message: text };
      }
    }
    const envelope = (json ?? {}) as { data?: unknown; message?: string };
    if (!response.ok) {
      return NextResponse.json({ message: envelope.message ?? "Request failed" }, { status: response.status || 500 });
    }
    return NextResponse.json(envelope.data ?? null, { status: response.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message: `Backend unreachable: ${message}` }, { status: 502 });
  }
}