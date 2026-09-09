"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SegmentedTabs } from "@/components/shared/SegmentedTabs";
import { StaffManagement } from "@/features/users/components/StaffManagement";
import { OutsourceManagement } from "./OutsourceManagement";

const TABS = ["Projects", "Outsource Cleaners", "Outsource Supervisors"] as const;
type Tab = (typeof TABS)[number];

const TAB_SLUG: Record<Tab, string> = {
  Projects: "projects",
  "Outsource Cleaners": "cleaners",
  "Outsource Supervisors": "supervisors",
};
const SLUG_TAB: Record<string, Tab> = {
  projects: "Projects",
  cleaners: "Outsource Cleaners",
  supervisors: "Outsource Supervisors",
};

export function OutsourceTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tab: Tab = SLUG_TAB[searchParams.get("tab") ?? ""] ?? "Projects";

  function setTab(next: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", TAB_SLUG[next]);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <>
      <div className="mb-6">
        <SegmentedTabs<Tab> options={[...TABS]} value={tab} onChange={setTab} />
      </div>

      {tab === "Projects" && <OutsourceManagement />}
      {tab === "Outsource Cleaners" && (
        <StaffManagement role="OUTSOURCE_CLEANER" noun="outsource cleaner" />
      )}
      {tab === "Outsource Supervisors" && (
        <StaffManagement role="OUTSOURCE_SUPERVISOR" noun="outsource supervisor" />
      )}
    </>
  );
}
