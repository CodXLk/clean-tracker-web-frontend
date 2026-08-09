import { redirect } from "next/navigation";
import { callBackend } from "@/lib/api/backend";
import { BACKEND } from "@/lib/api/endpoints";

interface MeData {
  role: string;
}

// Clients don't get an Inspections view — supervisor/admin-only surface.
// This is the route-level guard (nav-level filtering is deferred to later work).
export default async function InspectionsLayout({ children }: { children: React.ReactNode }) {
  const result = await callBackend(BACKEND.auth.me);
  const envelope = (result.json ?? {}) as { data?: MeData };

  if (result.ok && envelope.data?.role === "CLIENT") {
    redirect("/admin/dashboard");
  }

  return <>{children}</>;
}
