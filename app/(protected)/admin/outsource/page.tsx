"use client";

import { useIsDrawerNav } from "@/components/layout/AppNav";
import { PageHeader } from "@/components/shared/PageHeader";
import { OutsourceManagement } from "@/features/outsource/components/OutsourceManagement";
import { cn } from "@/lib/utils/cn";

export default function OutsourceProjectsPage() {
  const useDrawerNav = useIsDrawerNav();
  return (
    <>
      {!useDrawerNav && (
        <div className="lg:hidden">
          <PageHeader title="Outsource Projects" />
        </div>
      )}
      <div className={cn("px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8", !useDrawerNav ? "pb-28 lg:pb-8" : "pb-6 lg:pb-8")}>
        <div className="mx-auto max-w-7xl">
          <OutsourceManagement />
        </div>
      </div>
    </>
  );
}
