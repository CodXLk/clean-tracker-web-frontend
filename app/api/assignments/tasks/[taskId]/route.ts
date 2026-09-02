import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/assignments/tasks/[taskId]">) {
  const { taskId } = await ctx.params;
  return proxyBackend(BACKEND.assignments.taskById(taskId), { method: "DELETE" });
}
