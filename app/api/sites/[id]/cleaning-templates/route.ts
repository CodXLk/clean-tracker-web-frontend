import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/sites/[id]/cleaning-templates">) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.sites.cleaningTemplates(id), { method: "GET" });
}
