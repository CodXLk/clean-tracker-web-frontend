import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/sites/[id]/shifts">) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.sites.shifts(id), { method: "GET" });
}

export async function POST(request: NextRequest, ctx: RouteContext<"/api/sites/[id]/shifts">) {
  const { id } = await ctx.params;
  const body = await request.json();
  return proxyBackend(BACKEND.sites.shifts(id), { method: "POST", body });
}
