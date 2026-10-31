import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/inventory/deliveries/[id]">) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.inventory.deliveryById(id), { method: "GET" });
}

export async function POST(request: NextRequest, ctx: RouteContext<"/api/inventory/deliveries/[id]">) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.inventory.deliveryById(id), { method: "POST", body: await request.json() });
}
