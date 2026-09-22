import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/tasks/draft-photos/[id]">) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.tasks.draftPhoto(id), { method: "DELETE" });
}
