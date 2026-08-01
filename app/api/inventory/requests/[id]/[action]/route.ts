import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

// action ∈ approve | reject | cancel
export async function POST(request: NextRequest, ctx: RouteContext<"/api/inventory/requests/[id]/[action]">) {
  const { id, action } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  return proxyBackend(BACKEND.inventory.requestAction(id, action), { method: "POST", body });
}
