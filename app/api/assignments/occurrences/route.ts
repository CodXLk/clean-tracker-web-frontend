import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams.toString();
  const path = params ? `${BACKEND.assignments.occurrences}?${params}` : BACKEND.assignments.occurrences;
  return proxyBackend(path, { method: "GET" });
}
