import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/leave-requests/covers/[coverId]">) {
  const { coverId } = await ctx.params;
  return proxyBackend(BACKEND.leave.removeCover(coverId), { method: "DELETE" });
}
