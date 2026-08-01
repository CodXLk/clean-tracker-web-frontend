import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

// Supervisor review: mark task occurrences as completed (JSON body, no photos).
export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyBackend(BACKEND.tasks.reviewComplete, { method: "POST", body });
}
