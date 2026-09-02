import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/assignments/tasks/[taskId]/status">) {
  const { taskId } = await ctx.params;
  const params = request.nextUrl.searchParams.toString();
  const base = BACKEND.assignments.taskStatus(taskId);
  return proxyBackend(params ? `${base}?${params}` : base, { method: "PATCH" });
}
