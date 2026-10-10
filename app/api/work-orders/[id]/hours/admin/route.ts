import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/work-orders/[id]/hours/admin">) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  return proxyBackend(BACKEND.workOrders.hoursAdmin(id), { method: "PUT", body });
}
