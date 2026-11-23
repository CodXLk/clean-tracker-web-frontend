import { NextRequest, NextResponse } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

const ROLES = new Set(["CLEANER", "SUPERVISOR"]);
const ACTIONS = new Set(["complete", "reopen"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(_request: NextRequest, ctx: RouteContext<"/api/invoices/[id]/parts/[role]/[action]">) {
  const { id, role, action } = await ctx.params;
  if (!UUID_RE.test(id) || !ROLES.has(role) || !ACTIONS.has(action)) {
    return NextResponse.json({ message: "Unknown action" }, { status: 404 });
  }
  return proxyBackend(BACKEND.invoices.part(id, role, action), { method: "POST" });
}