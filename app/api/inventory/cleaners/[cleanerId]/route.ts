import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/inventory/cleaners/[cleanerId]">) {
  const { cleanerId } = await ctx.params;
  return proxyBackend(BACKEND.inventory.cleanerInventory(cleanerId), { method: "GET" });
}
