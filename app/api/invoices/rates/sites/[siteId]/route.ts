import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

type Ctx = RouteContext<"/api/invoices/rates/sites/[siteId]">;

export async function GET(_request: NextRequest, ctx: Ctx) {
  const { siteId } = await ctx.params;
  return proxyBackend(BACKEND.invoices.siteRates(siteId), { method: "GET" });
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const { siteId } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  return proxyBackend(BACKEND.invoices.siteRates(siteId), { method: "POST", body });
}
