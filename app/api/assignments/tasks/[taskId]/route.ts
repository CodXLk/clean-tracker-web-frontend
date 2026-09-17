import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/assignments/tasks/[taskId]">) {
  const { taskId } = await ctx.params;
  return proxyBackend(BACKEND.assignments.taskById(taskId), { method: "GET" });
}

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/assignments/tasks/[taskId]">) {
  const { taskId } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  return proxyBackend(BACKEND.assignments.taskById(taskId), { method: "PATCH", body });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/assignments/tasks/[taskId]">) {
  const { taskId } = await ctx.params;
  return proxyBackend(BACKEND.assignments.taskById(taskId), { method: "DELETE" });
}
