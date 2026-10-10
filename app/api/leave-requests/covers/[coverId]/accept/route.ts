import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function POST(_request: NextRequest, ctx: RouteContext<"/api/leave-requests/covers/[coverId]/accept">) {
  const { coverId } = await ctx.params;
  return proxyBackend(BACKEND.leave.acceptCover(coverId), { method: "POST" });
}
