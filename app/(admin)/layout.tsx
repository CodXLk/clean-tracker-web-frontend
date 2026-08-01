import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
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
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFB] lg:flex-row">
      <AdminSidebar />
      <main className="flex min-h-screen min-w-0 flex-1 flex-col overflow-auto lg:ml-64">
        <AdminTopBar />
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
