import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

type Ctx = RouteContext<"/api/inventory/items/[id]">;

export async function GET(_request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.inventory.itemById(id), { method: "GET" });
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await request.json();
  return proxyBackend(BACKEND.inventory.itemById(id), { method: "PUT", body });
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.inventory.itemById(id), { method: "DELETE" });
}
