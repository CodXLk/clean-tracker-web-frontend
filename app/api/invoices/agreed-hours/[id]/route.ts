import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/invoices/agreed-hours/[id]">) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.invoices.agreedHoursItem(id), { method: "DELETE" });
}
