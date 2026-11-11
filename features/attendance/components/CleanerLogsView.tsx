"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AttendanceLogsTable } from "@/features/attendance/components/AttendanceLogsTable";
import { TimeSummaryTable } from "@/features/attendance/components/TimeSummaryTable";
import { HoursReviewTable } from "@/features/work-ledger/components/HoursReviewTable";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { id: "logs", label: "Sessions" },
  { id: "time", label: "Time summary" },
  { id: "hours", label: "Hours review" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function CleanerLogsView() {
  const params = useSearchParams();
  const [tab, setTab] = useState<TabId>(() => TABS.find((t) => t.id === params.get("tab"))?.id ?? "logs");
  return (
    <>
      <div className="mb-4 flex gap-2" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              tab === t.id ? "bg-primary text-white" : "bg-white text-grey-700 hover:bg-grey-100",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "logs" ? <AttendanceLogsTable /> : tab === "time" ? <TimeSummaryTable /> : <HoursReviewTable />}
    </>
  );
}
