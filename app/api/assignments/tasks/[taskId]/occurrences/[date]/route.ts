import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

type Ctx = RouteContext<"/api/assignments/tasks/[taskId]/occurrences/[date]">;

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { taskId, date } = await ctx.params;
  const body = await request.json();
  return proxyBackend(BACKEND.assignments.occurrence(taskId, date), { method: "PATCH", body });
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const { taskId, date } = await ctx.params;
  const scope = request.nextUrl.searchParams.get("scope") ?? "THIS";
  return proxyBackend(`${BACKEND.assignments.occurrence(taskId, date)}?scope=${scope}`, {
    method: "DELETE",
  });
}
