import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/sites/[id]/cleaner-profiles/[profileId]/shifts">,
) {
  const { id, profileId } = await ctx.params;
  const body = await request.json();
  return proxyBackend(BACKEND.sites.cleanerProfileShifts(id, profileId), { method: "PUT", body });
}
