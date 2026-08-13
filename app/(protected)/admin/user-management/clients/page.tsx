import { ClientManagement } from "@/features/user-management/components/ClientManagement";

export default function ClientManagementPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-sm text-grey-500">Manage clients belonging to each client-company.</p>
        </div>
        <ClientManagement />
      </div>
    </div>
  );
}
