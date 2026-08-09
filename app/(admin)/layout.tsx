import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AUTH_COOKIE } from "@/lib/constants";
import { isAdminRole, roleFromToken } from "@/lib/auth/roles";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) {
    redirect("/login");
  }
  // Cleaners/clients belong in the cleaner app. Supervisors are allowed into the admin
  // shell but the middleware restricts them to their allow-listed pages (e.g. Cleaner Logs).
  const role = roleFromToken(token);
  if (!isAdminRole(role) && role !== "SUPERVISOR") {
    redirect("/dashboard?denied=admin");
  }

  return <AppShell>{children}</AppShell>;
}
