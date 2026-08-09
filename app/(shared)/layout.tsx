import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AUTH_COOKIE } from "@/lib/constants";

/**
 * Layout for routes shared by every role (Complaints, Inventory) — no role
 * gate here, only an auth check. `proxy.ts` + `canAccessAdminPath` already
 * allow these specific `/admin/*` paths for all authenticated roles.
 */
export default async function SharedLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) {
    redirect("/login");
  }

  return <AppShell>{children}</AppShell>;
}
