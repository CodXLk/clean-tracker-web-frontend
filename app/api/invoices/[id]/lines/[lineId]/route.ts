import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/invoices/[id]/lines/[lineId]">) {
  const { id, lineId } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  return proxyBackend(BACKEND.invoices.line(id, lineId), { method: "PUT", body });
}
