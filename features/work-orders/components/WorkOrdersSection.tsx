"use client";

import { useState } from "react";
import { SegmentedTabs } from "@/components/shared/SegmentedTabs";
import { SiteManagement } from "@/features/user-management/components/SiteManagement";
import { WorkOrdersTab } from "./WorkOrdersTab";

const INNER_TABS = ["Work Orders", "Work Order Sites"] as const;
type InnerTab = (typeof INNER_TABS)[number];

/**
 * Work Orders section — an inner switch between the work orders table and the
 * work-order-only sites table. The "Add work order site" action lives beside
 * "New work order" and jumps straight into creating a site.
 */
export function WorkOrdersSection() {
  const [tab, setTab] = useState<InnerTab>("Work Orders");
  const [createSiteSignal, setCreateSiteSignal] = useState(0);

  function addWorkOrderSite() {
    setTab("Work Order Sites");
    setCreateSiteSignal((n) => n + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <SegmentedTabs<InnerTab> options={INNER_TABS} value={tab} onChange={setTab} />

      {tab === "Work Orders" ? (
        <WorkOrdersTab onAddWorkOrderSite={addWorkOrderSite} />
      ) : (
        <SiteManagement workOrderSite openCreateSignal={createSiteSignal} />
      )}
    </div>
  );
}
