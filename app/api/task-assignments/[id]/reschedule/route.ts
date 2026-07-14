import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/task-assignments/[id]/reschedule">) {
  const { id } = await ctx.params;
  const body = await request.json();
  return proxyBackend(BACKEND.taskAssignments.reschedule(id), { method: "PATCH", body });
}
