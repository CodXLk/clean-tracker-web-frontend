import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/shifts/[id]">) {
  const { id } = await ctx.params;
  const body = await request.json();
  return proxyBackend(BACKEND.shifts.byId(id), { method: "PUT", body });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/shifts/[id]">) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.shifts.byId(id), { method: "DELETE" });
}
