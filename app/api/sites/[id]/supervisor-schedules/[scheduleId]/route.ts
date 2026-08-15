import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; scheduleId: string }> },
) {
  const { id, scheduleId } = await params;
  return proxyBackend(BACKEND.sites.supervisorSchedule(id, scheduleId), { method: "DELETE" });
}
