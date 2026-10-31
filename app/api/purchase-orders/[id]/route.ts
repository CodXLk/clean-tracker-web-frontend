import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function GET(request: NextRequest, ctx: RouteContext<"/api/purchase-orders/[id]">) {
  const { id } = await ctx.params;
  return proxyBackend(`${BACKEND.purchaseOrders.byId(id)}${request.nextUrl.search}`, { method: "GET" });
}

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/purchase-orders/[id]">) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.purchaseOrders.byId(id), { method: "PUT", body: await request.json() });
}
