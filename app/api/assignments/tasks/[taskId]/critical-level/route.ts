import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/assignments/tasks/[taskId]/critical-level">,
) {
  const { taskId } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  return proxyBackend(BACKEND.assignments.taskCriticalLevel(taskId), { method: "PATCH", body });
}
