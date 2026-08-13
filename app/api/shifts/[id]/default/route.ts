import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function POST(_request: NextRequest, ctx: RouteContext<"/api/shifts/[id]/default">) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.shifts.default(id), { method: "POST" });
}
