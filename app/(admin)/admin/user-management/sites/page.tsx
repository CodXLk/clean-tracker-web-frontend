import { SiteManagement } from "@/features/user-management/components/SiteManagement";

export default function SiteManagementPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-on-surface">Site Management</h1>
          <p className="mt-1 text-sm text-grey-500">Manage sites and their map locations.</p>
        </div>
        <SiteManagement />
      </div>
    </div>
  );
}
