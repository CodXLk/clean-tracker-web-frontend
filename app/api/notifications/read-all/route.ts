import { proxyBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

export async function POST() {
  return proxyBackend(BACKEND.notifications.readAll, { method: "POST" });
}
