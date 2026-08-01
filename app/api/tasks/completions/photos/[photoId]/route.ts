import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/constants";
import { BACKEND } from "@/lib/api/endpoints";

interface RouteContext {
  params: Promise<{ photoId: string }>;
}

// Streams a task-completion photo (binary) from the Spring backend to the browser.
export async function GET(_request: NextRequest, context: RouteContext) {
  const { photoId } = await context.params;

  const headers: Record<string, string> = {
    "x-api-key": process.env.SPRING_BOOT_API_KEY ?? "",
  };
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const response = await fetch(
      `${process.env.SPRING_BOOT_API_URL}${BACKEND.tasks.photo(photoId)}`,
      { method: "GET", headers, cache: "no-store" },
    );
    if (!response.ok) {
      return NextResponse.json({ message: "Photo not found" }, { status: response.status });
    }
    const contentType = response.headers.get("content-type") ?? "application/octet-stream";
    const buffer = await response.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message: `Backend unreachable: ${message}` }, { status: 502 });
  }
}
