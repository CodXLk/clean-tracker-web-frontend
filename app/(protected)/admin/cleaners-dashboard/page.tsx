"use client";

import { useState } from "react";
import { useIsDrawerNav } from "@/components/layout/AppNav";
import { PageHeader } from "@/components/shared/PageHeader";
import { SegmentedTabs } from "@/components/shared/SegmentedTabs";
import { cn } from "@/lib/utils/cn";
import { OperationsOverviewTab } from "@/features/live-dashboard/components/OperationsOverviewTab";
import { LiveLocationMap } from "@/features/live-dashboard/components/LiveLocationMap";

const TABS = ["Overview", "Cleaners Map"] as const;
type Tab = (typeof TABS)[number];

export default function CleanersDashboardPage() {
  const useDrawerNav = useIsDrawerNav();
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <>
      {!useDrawerNav && (
        <div className="lg:hidden">
          <PageHeader title="Cleaners Dashboard" />
        </div>
      )}

      <div className={cn("px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8", !useDrawerNav ? "pb-28 lg:pb-8" : "pb-6 lg:pb-8")}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <SegmentedTabs<Tab> options={TABS} value={tab} onChange={setTab} />
          </div>

          {tab === "Overview" && <OperationsOverviewTab audience="cleaners" />}
          {tab === "Cleaners Map" && <LiveLocationMap audience="cleaners" />}
        </div>
      </div>
    </>
  );
}
