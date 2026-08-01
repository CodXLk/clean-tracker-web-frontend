import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

type Ctx = RouteContext<"/api/assignment-drafts/[id]">;

export async function GET(_request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.assignmentDrafts.byId(id), { method: "GET" });
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await request.json();
  return proxyBackend(BACKEND.assignmentDrafts.byId(id), { method: "PUT", body });
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  return proxyBackend(BACKEND.assignmentDrafts.byId(id), { method: "DELETE" });
}
