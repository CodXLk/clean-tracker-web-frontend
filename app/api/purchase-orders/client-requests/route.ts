import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function GET() {
  return proxyBackend(BACKEND.purchaseOrders.clientRequests, { method: "GET" });
}
