import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

// Public endpoint — no auth cookie required to complete first-time setup.
export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyBackend(BACKEND.auth.accountSetup, { method: "POST", body, auth: false });
}
