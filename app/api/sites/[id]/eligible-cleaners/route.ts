import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/sites/[id]/eligible-cleaners">) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.sites.eligibleCleaners(id), { method: "GET" });
}
