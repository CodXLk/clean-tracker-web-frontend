import { NextRequest, NextResponse } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

const ACTIONS = new Set(["regenerate", "finalize", "paid", "reopen"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(_request: NextRequest, ctx: RouteContext<"/api/invoices/[id]/[action]">) {
  const { id, action } = await ctx.params;
  if (!ACTIONS.has(action) || !UUID_RE.test(id)) {
    return NextResponse.json({ message: "Unknown action" }, { status: 404 });
  }
  return proxyBackend(BACKEND.invoices.action(id, action), { method: "POST" });
}
