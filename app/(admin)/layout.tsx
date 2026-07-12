import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F8FAFB]">
      <AdminSidebar />
      <main className="lg:ml-64 flex-1 overflow-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
