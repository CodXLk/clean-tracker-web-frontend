"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { PageHeader } from "@/components/shared/PageHeader";
import { CalendarModal } from "@/components/modals/CalendarModal";
import { cn } from "@/lib/utils/cn";

interface SiteArea {
  id:          string;
  site:        string;
  area:        string;
  taskCount:   number;
  pendingCount: number;
}

const SITE_AREAS: SiteArea[] = [
  { id: "1", site: "Site A", area: "Lobby",    taskCount: 3, pendingCount: 3 },
  { id: "2", site: "Site A", area: "Floor 2",  taskCount: 2, pendingCount: 1 },
  { id: "3", site: "Site B", area: "Restroom", taskCount: 4, pendingCount: 2 },
  { id: "4", site: "Site B", area: "Lobby",    taskCount: 2, pendingCount: 2 },
];

const KPI_CARDS = [
  { label: "Pending",   value: 8,  color: "orange" as const },
  { label: "Completed", value: 3,  color: "green"  as const },
  { label: "Total",     value: 11, color: "grey"   as const },
];

export default function TasksPage() {
  const [calendarOpen, setCalendarOpen] = useState(false);

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at top left, rgba(71,114,115,0.18) 0%, transparent 60%), #F5F5F5",
      }}
    >
      <PageHeader
        title="Tasks"
        showCalendar
        onCalendarClick={() => setCalendarOpen(true)}
      />

      <main className="mx-auto max-w-2xl px-5 pb-28 lg:max-w-5xl -mt-5">
        {/* KPI row */}
        <div className="mb-5 grid grid-cols-3 gap-3 pt-5">
          {KPI_CARDS.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>

        {/* Site area list */}
        <div className="flex flex-col gap-3">
          {SITE_AREAS.map((area) => (
            <Link
              key={area.id}
              href={`/dashboard/tasks/${encodeURIComponent(area.area)}`}
              className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-on-surface">{area.area}</span>
                <span className="text-xs text-grey-500">{area.site}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-xs text-grey-700">
                    {area.taskCount} tasks
                  </span>
                  <span className="rounded-full bg-[#ED5F25]/20 px-2.5 py-0.5 text-xs font-medium text-[#ED5F25]">
                    {area.pendingCount} pending
                  </span>
                </div>
                <ChevronRight size={18} className="text-grey-500" />
              </div>
            </Link>
          ))}
        </div>
      </main>

      <CalendarModal open={calendarOpen} onClose={() => setCalendarOpen(false)} />

      <BottomNavBar />
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: number;
  color: "orange" | "green" | "grey";
}

function KpiCard({ label, value, color }: KpiCardProps) {
  const colorMap = {
    orange: "text-[#ED5F25] bg-[#ED5F25]/10",
    green:  "text-success bg-success/10",
    grey:   "text-grey-700 bg-grey-100",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-2xl py-4",
        colorMap[color],
      )}
    >
      <span className="text-2xl font-bold leading-none">{value}</span>
      <span className="text-[11px] font-medium opacity-80 text-center leading-tight">{label}</span>
    </div>
  );
}
