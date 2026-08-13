import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/users/[id]/detail">) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.users.detail(id), { method: "GET" });
}
