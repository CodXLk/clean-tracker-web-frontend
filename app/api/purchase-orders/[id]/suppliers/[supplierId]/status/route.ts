import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string; supplierId: string }> }) {
  const { id, supplierId } = await ctx.params;
  return proxyBackend(`${BACKEND.purchaseOrders.supplierStatus(id, supplierId)}${request.nextUrl.search}`, { method: "POST", body: {} });
}