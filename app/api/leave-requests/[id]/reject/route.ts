import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function POST(_request: NextRequest, ctx: RouteContext<"/api/leave-requests/[id]/reject">) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.leave.reject(id), { method: "POST" });
}
