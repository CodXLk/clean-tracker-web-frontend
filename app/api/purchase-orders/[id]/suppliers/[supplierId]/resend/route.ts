import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function POST(_request: NextRequest, ctx: { params: Promise<{ id: string; supplierId: string }> }) {
  const { id, supplierId } = await ctx.params;
  return proxyBackend(BACKEND.purchaseOrders.supplierResend(id, supplierId), { method: "POST", body: {} });
}
