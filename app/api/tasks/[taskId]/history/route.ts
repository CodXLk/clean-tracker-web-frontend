import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function GET(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const search = request.nextUrl.searchParams.toString();
  const base = BACKEND.tasks.history(taskId);
  return proxyBackend(search ? `${base}?${search}` : base, { method: "GET" });
}
