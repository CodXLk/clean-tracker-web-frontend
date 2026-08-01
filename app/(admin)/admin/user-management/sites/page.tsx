import { SiteManagement } from "@/features/user-management/components/SiteManagement";

export default function SiteManagementPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-sm text-grey-500">Manage sites and their map locations.</p>
        </div>
        <SiteManagement />
      </div>
    </div>
  );
}
