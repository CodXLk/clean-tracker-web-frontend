import { NextRequest } from "next/server";
import { BACKEND } from "@/lib/api/endpoints";
import { proxyBackend } from "@/lib/api/backend";

type Ctx = RouteContext<"/api/documents/[id]/verify">;

// Verify or un-verify a compliance document (management). Pass ?verified=false to un-verify.
export async function POST(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const verified = new URL(request.url).searchParams.get("verified") ?? "true";
  return proxyBackend(`${BACKEND.documents.verify(id)}?verified=${verified}`, { method: "POST" });
}
