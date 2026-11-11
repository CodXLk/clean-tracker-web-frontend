import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/invoices/rates/[rateId]">) {
  const { rateId } = await ctx.params;
  return proxyBackend(BACKEND.invoices.rate(rateId), { method: "DELETE" });
}
