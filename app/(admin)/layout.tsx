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
    <div className="flex min-h-screen bg-[#F8FAFB]">
      <AdminSidebar />
      <main className="lg:ml-64 flex-1 overflow-auto min-w-0">{children}</main>
    </div>
  );
}
