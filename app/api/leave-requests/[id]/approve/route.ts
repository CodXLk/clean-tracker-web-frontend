import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function POST(_request: NextRequest, ctx: RouteContext<"/api/leave-requests/[id]/approve">) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.leave.approve(id), { method: "POST" });
}
