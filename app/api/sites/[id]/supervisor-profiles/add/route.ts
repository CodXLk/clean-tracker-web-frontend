import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/sites/[id]/supervisor-profiles/add">) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  return proxyBackend(BACKEND.sites.addSupervisorProfile(id), { method: "POST", body });
}
