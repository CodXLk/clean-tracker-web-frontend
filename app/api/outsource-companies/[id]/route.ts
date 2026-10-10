import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/outsource-companies/[id]">) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  return proxyBackend(BACKEND.outsourceCompanies.byId(id), { method: "PUT", body });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/outsource-companies/[id]">) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.outsourceCompanies.byId(id), { method: "DELETE" });
}
