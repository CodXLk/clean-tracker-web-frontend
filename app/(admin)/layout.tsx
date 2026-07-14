import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AUTH_COOKIE } from "@/lib/constants";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFB] lg:flex-row">
      <AdminSidebar />
      <main className="min-w-0 flex-1 overflow-auto lg:ml-64">{children}</main>
    </div>
  );
}
