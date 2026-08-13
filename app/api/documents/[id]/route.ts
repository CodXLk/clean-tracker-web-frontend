import { NextRequest } from "next/server";
import { BACKEND } from "@/lib/api/endpoints";
import { proxyBackend } from "@/lib/api/backend";

type Ctx = RouteContext<"/api/documents/[id]">;

// Delete a compliance document.
export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.documents.byId(id), { method: "DELETE" });
}
