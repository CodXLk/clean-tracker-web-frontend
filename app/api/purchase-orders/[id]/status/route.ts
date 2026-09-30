import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/purchase-orders/[id]/status">) {
  const { id } = await ctx.params;
  const status = request.nextUrl.searchParams.get("status") ?? "";
  return proxyBackend(`${BACKEND.purchaseOrders.status(id)}?status=${encodeURIComponent(status)}`, {
    method: "POST",
    body: {},
  });
}
