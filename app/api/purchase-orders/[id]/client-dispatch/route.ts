import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/purchase-orders/[id]/client-dispatch">) {
  const { id } = await ctx.params;
  const body = await request.json();
  return proxyBackend(BACKEND.purchaseOrders.clientDispatch(id), { method: "POST", body });
}
