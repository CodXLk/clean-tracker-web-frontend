import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/outsource-projects/[id]/supervisor-profiles">,
) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.outsourceProjects.supervisorProfiles(id), { method: "GET" });
}

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/outsource-projects/[id]/supervisor-profiles">,
) {
  const { id } = await ctx.params;
  const body = await request.json();
  return proxyBackend(BACKEND.outsourceProjects.supervisorProfiles(id), { method: "PUT", body });
}
