import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function POST(_request: NextRequest, ctx: RouteContext<"/api/assignments/tasks/[taskId]/restore">) {
  const { taskId } = await ctx.params;
  return proxyBackend(BACKEND.assignments.taskRestore(taskId), { method: "POST" });
}
