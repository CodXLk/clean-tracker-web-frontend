import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AUTH_COOKIE } from "@/lib/constants";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) {
    redirect("/login");
  }
  // Role-based restriction (admin/supervisor-only) is deferred to later work —
  // every authenticated user can reach these pages for now; the merged nav
  // shows them all until per-role trimming is added.

  return <AppShell>{children}</AppShell>;
}
