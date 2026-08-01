import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/inventory/sites/[siteId]/adjust">) {
  const { siteId } = await ctx.params;
  const body = await request.json();
  return proxyBackend(BACKEND.inventory.siteAdjust(siteId), { method: "POST", body });
}
