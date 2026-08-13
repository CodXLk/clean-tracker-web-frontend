import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

type Ctx = RouteContext<"/api/assignments/tasks/[taskId]/occurrences/[date]/content">;

export async function PUT(request: NextRequest, ctx: Ctx) {
  const { taskId, date } = await ctx.params;
  const body = await request.json();
  return proxyBackend(BACKEND.assignments.occurrenceContent(taskId, date), { method: "PUT", body });
}
