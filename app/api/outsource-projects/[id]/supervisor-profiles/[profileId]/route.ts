import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/outsource-projects/[id]/supervisor-profiles/[profileId]">,
) {
  const { id, profileId } = await ctx.params;
  return proxyBackend(BACKEND.outsourceProjects.removeSupervisorProfile(id, profileId), { method: "DELETE" });
}
