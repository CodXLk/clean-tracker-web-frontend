import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/constants";
import { BACKEND } from "@/lib/api/endpoints";

interface RouteContext {
  params: Promise<{ taskId: string }>;
}

// Forwards the multipart form (`photos` files) for a critical task to the Spring backend.
// proxyBackend can't be used here because multipart needs the original FormData + boundary.
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { taskId } = await context.params;
    const formData = await request.formData();

    const headers: Record<string, string> = {
      "x-api-key": process.env.SPRING_BOOT_API_KEY ?? "",
    };
    const token = (await cookies()).get(AUTH_COOKIE)?.value;
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(
      `${process.env.SPRING_BOOT_API_URL}${BACKEND.assignments.taskReferencePhotos(taskId)}`,
      {
        method: "POST",
        headers, // no Content-Type — fetch sets the multipart boundary from the body
        body: formData,
        cache: "no-store",
      },
    );

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
