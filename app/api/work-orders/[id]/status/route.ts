import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/work-orders/[id]/status">) {
  const { id } = await ctx.params;
  const body = await request.json();
  return proxyBackend(BACKEND.workOrders.status(id), { method: "PATCH", body });
}
