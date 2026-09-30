import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/constants";
import { BACKEND } from "@/lib/api/endpoints";

type Ctx = RouteContext<"/api/inventory/items/[id]/units">;

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "x-api-key": process.env.SPRING_BOOT_API_KEY ?? "" };
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function GET(_request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const response = await fetch(`${process.env.SPRING_BOOT_API_URL}${BACKEND.inventory.itemUnits(id)}`, {
    method: "GET",
    headers: await authHeaders(),
    cache: "no-store",
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  const message = (json as { message?: string })?.message ?? "Request failed";
  if (!response.ok) return NextResponse.json({ message }, { status: response.status });
  return NextResponse.json((json as { data?: unknown })?.data ?? [], { status: 200 });
}
