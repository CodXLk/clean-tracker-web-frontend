import { ClientCompanyManagement } from "@/features/user-management/components/ClientCompanyManagement";

export default function ClientCompanyManagementPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-on-surface">Client-Company Management</h1>
          <p className="mt-1 text-sm text-grey-500">Create and manage the businesses you serve.</p>
        </div>
        <ClientCompanyManagement />
      </div>
    </div>
  );
}
