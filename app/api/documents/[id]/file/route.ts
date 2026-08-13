import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/constants";
import { BACKEND } from "@/lib/api/endpoints";

type Ctx = RouteContext<"/api/documents/[id]/file">;

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "x-api-key": process.env.SPRING_BOOT_API_KEY ?? "" };
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

// Stream a compliance document file (image or PDF) from the backend to the browser.
export async function GET(_request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const response = await fetch(`${process.env.SPRING_BOOT_API_URL}${BACKEND.documents.file(id)}`, {
    method: "GET",
    headers: await authHeaders(),
    cache: "no-store",
  });
  if (!response.ok) {
    return NextResponse.json({ message: "Document not found" }, { status: response.status });
  }
  const contentType = response.headers.get("content-type") ?? "application/octet-stream";
  const buffer = await response.arrayBuffer();
  return new NextResponse(buffer, {
    status: 200,
    headers: { "Content-Type": contentType, "Cache-Control": "private, max-age=3600" },
  });
}
