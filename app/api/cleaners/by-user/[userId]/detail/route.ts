import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/cleaners/by-user/[userId]/detail">) {
  const { userId } = await ctx.params;
  return proxyBackend(BACKEND.cleaners.detailByUser(userId), { method: "GET" });
}
