import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/work-orders/[id]/cleaner-profiles/[profileId]">,
) {
  const { id, profileId } = await ctx.params;
  return proxyBackend(BACKEND.workOrders.removeCleanerProfile(id, profileId), { method: "DELETE" });
}
