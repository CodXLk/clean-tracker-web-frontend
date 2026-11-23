import { NextRequest, NextResponse } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

const ACTIONS = new Set(["refresh", "submit", "approve", "reject", "reopen", "paid"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest, ctx: RouteContext<"/api/invoices/[id]/[action]">) {
  const { id, action } = await ctx.params;
  if (!ACTIONS.has(action) || !UUID_RE.test(id)) {
    return NextResponse.json({ message: "Unknown action" }, { status: 404 });
  }
  const body = await request.json().catch(() => ({}));
  return proxyBackend(BACKEND.invoices.action(id, action), { method: "POST", body });
}