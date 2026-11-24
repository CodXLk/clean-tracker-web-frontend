import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

/** Start a self-service sign-in email change (body `{ newEmail, currentPassword }`); a code is emailed. */
export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyBackend(BACKEND.users.emailChange, { method: "POST", body });
}

/** Cancel a pending email change. */
export async function DELETE() {
  return proxyBackend(BACKEND.users.emailChange, { method: "DELETE" });
}