import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/inventory/cleaners/[cleanerId]/min-stock">) {
  const { cleanerId } = await ctx.params;
  const body = await request.json();
  return proxyBackend(BACKEND.inventory.cleanerMinStock(cleanerId), { method: "POST", body });
}
