import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/sites/[id]/cleaner-profiles/add">) {
  const { id } = await ctx.params;
  const body = await request.json();
  return proxyBackend(BACKEND.sites.addCleanerProfile(id), { method: "POST", body });
}
