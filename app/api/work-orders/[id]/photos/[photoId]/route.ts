import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/work-orders/[id]/photos/[photoId]">,
) {
  const { id, photoId } = await ctx.params;
  return proxyBackend(BACKEND.workOrders.deletePhoto(id, photoId), { method: "DELETE" });
}
