import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/work-orders/[id]/hours">) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.workOrders.hours(id), { method: "GET" });
}
