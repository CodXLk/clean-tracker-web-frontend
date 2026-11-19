import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.users.certificateWaiver(id), { method: "GET" });
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  return proxyBackend(BACKEND.users.certificateWaiver(id), { method: "POST", body });
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.users.certificateWaiver(id), { method: "DELETE" });
}
