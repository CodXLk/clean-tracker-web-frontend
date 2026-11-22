import { NextRequest } from "next/server";
import { BACKEND } from "@/lib/api/endpoints";
import { proxyMultipart } from "@/lib/api/multipart";

export async function POST(request: NextRequest) {
  return proxyMultipart(request, BACKEND.complaints.clientCreate);
}