import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/constants";
import { BACKEND } from "@/lib/api/endpoints";
import { proxyBackend } from "@/lib/api/backend";

type Ctx = RouteContext<"/api/users/[id]/documents">;

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "x-api-key": process.env.SPRING_BOOT_API_KEY ?? "" };
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

// List a user's compliance documents.
export async function GET(_request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.users.documents(id), { method: "GET" });
}

// Upload a compliance document (multipart). FormData is forwarded verbatim so the
// browser-set multipart boundary is preserved (never set Content-Type manually).
export async function POST(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const formData = await request.formData();
  const response = await fetch(`${process.env.SPRING_BOOT_API_URL}${BACKEND.users.documents(id)}`, {
    method: "POST",
    headers: await authHeaders(),
    body: formData,
    cache: "no-store",
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  const message = (json as { message?: string })?.message ?? "Request failed";
  if (!response.ok) return NextResponse.json({ message }, { status: response.status });
  return NextResponse.json((json as { data?: unknown })?.data ?? null, { status: 201 });
}
