import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function POST(_request: NextRequest, ctx: RouteContext<"/api/purchase-orders/[id]/cancel">) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.purchaseOrders.cancel(id), { method: "POST", body: {} });
}
