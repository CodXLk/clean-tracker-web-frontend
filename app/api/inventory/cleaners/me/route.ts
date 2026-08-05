import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function GET(_request: NextRequest) {
  return proxyBackend(BACKEND.inventory.cleanerInventoryMine, { method: "GET" });
}
