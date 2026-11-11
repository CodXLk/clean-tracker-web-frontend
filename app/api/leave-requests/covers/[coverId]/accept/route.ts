import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/leave-requests/covers/[coverId]/accept">) {
  const { coverId } = await ctx.params;
  // A cleaning cover may carry the cover's shifts; send no body otherwise.
  const body = await request.json().catch(() => null);
  return proxyBackend(
    BACKEND.leave.acceptCover(coverId),
    body?.days ? { method: "POST", body } : { method: "POST" },
  );
}
