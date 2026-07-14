import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/sites/[id]">) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.sites.byId(id), { method: "GET" });
}

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/sites/[id]">) {
  const { id } = await ctx.params;
  const body = await request.json();
  return proxyBackend(BACKEND.sites.byId(id), { method: "PUT", body });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/sites/[id]">) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.sites.byId(id), { method: "DELETE" });
}
