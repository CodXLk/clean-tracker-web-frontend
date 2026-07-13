import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function POST(_request: NextRequest, ctx: RouteContext<"/api/users/[id]/resend-setup">) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.users.resendSetup(id), { method: "POST" });
}
