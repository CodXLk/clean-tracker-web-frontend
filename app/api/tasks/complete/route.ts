import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/constants";
import { BACKEND } from "@/lib/api/endpoints";

// Forwards the multipart form (JSON `data` part + `photos` files) to the Spring backend.
// proxyBackend can't be used here because it JSON-serializes the body and forces a
// application/json content type; multipart needs the original FormData + boundary.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const headers: Record<string, string> = {
      "x-api-key": process.env.SPRING_BOOT_API_KEY ?? "",
    };
    const token = (await cookies()).get(AUTH_COOKIE)?.value;
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${process.env.SPRING_BOOT_API_URL}${BACKEND.tasks.complete}`, {
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
      return NextResponse.json(
        { message: envelope.message ?? "Request failed" },
        { status: response.status || 500 },
      );
    }
    return NextResponse.json(envelope.data ?? null, { status: response.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message: `Backend unreachable: ${message}` }, { status: 502 });
  }
}
