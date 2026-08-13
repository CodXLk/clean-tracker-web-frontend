"use client";

import { useIsDrawerNav } from "@/components/layout/AppNav";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils/cn";

export default function AdminDashboardPage() {
  const useDrawerNav = useIsDrawerNav();

  return (
    <>
      {!useDrawerNav && (
        <div className="lg:hidden">
          <PageHeader title="Dashboard" />
        </div>
      )}

      <div className={cn("px-6 pt-6 lg:px-8 lg:pt-8", !useDrawerNav ? "pb-28 lg:pb-8" : "pb-6 lg:pb-8")}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <p className="text-sm text-grey-500">Operations overview</p>
          </div>
          <AdminDashboard />
        </div>
      </div>
    </>
  );
}
