import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function POST(
  _request: NextRequest,
  ctx: RouteContext<"/api/outsource-projects/[id]/supervisor-profiles/add">,
) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.outsourceProjects.addSupervisorProfile(id), { method: "POST", body: {} });
}
