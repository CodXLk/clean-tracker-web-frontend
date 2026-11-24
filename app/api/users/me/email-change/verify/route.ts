import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

/** Confirm the new sign-in email with the emailed code (body `{ code }`). */
export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyBackend(BACKEND.users.emailChangeVerify, { method: "POST", body });
}