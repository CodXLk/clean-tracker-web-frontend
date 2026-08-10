import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/outsource-projects/[id]">) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.outsourceProjects.byId(id), { method: "GET" });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/outsource-projects/[id]">) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.outsourceProjects.byId(id), { method: "DELETE" });
}
