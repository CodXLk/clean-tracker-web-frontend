"use client";

import { useState } from "react";
import { Users2, Calendar, Star, Building2, type LucideIcon } from "lucide-react";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { ActiveTaskCard } from "@/components/admin/ActiveTaskCard";
import { WorkforceCalendar } from "@/components/admin/WorkforceCalendar";
import { NewAssignmentModal } from "@/components/admin/NewAssignmentModal";
import type { AssignmentFormData } from "@/components/admin/NewAssignmentModal";

// ── Static data ───────────────────────────────────────────────────────────────

interface WorkforceStatData {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  value: string | number;
  label: string;
  badge: string;
  badgeColor: string;
}

const WORKFORCE_STATS: WorkforceStatData[] = [
  {
    icon: Users2,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    value: 5,
    label: "Active Cleaners",
    badge: "5/6",
    badgeColor: "text-primary",
  },
  {
    icon: Calendar,
    iconBg: "bg-[#ED5F25]/10",
    iconColor: "text-[#ED5F25]",
    value: 5,
    label: "Today's Tasks",
    badge: "+2",
    badgeColor: "text-[#ED5F25]",
  },
  {
    icon: Star,
    iconBg: "bg-success/10",
    iconColor: "text-success",
    value: "9.1",
    label: "Avg. Rating",
    badge: "+0.2",
    badgeColor: "text-success",
  },
  {
    icon: Building2,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    value: 4,
    label: "Sites Managed",
    badge: "0",
    badgeColor: "text-grey-500",
  },
];

interface ActiveTaskData {
  cleaner: {
    initials: string;
    name: string;
    gradientFrom: string;
    gradientTo: string;
  };
  site: string;
  area: string;
  time: string;
  category: string;
  priority: "high" | "medium" | "low";
  status: "Active" | "Scheduled" | "In Progress";
}

const ACTIVE_TASKS: ActiveTaskData[] = [
  {
    cleaner: { initials: "JD", name: "Jane Doe",      gradientFrom: "#2B7FFF", gradientTo: "#155DFC" },
    site: "Site A",
    area: "Floor 3 - Offices",
    time: "08:00",
    category: "General Cleaning",
    priority: "medium",
    status: "Active",
  },
  {
    cleaner: { initials: "JS", name: "John Smith",    gradientFrom: "#AD46FF", gradientTo: "#9810FA" },
    site: "Site A",
    area: "Floor 1 - Lobby",
    time: "10:00",
    category: "Periodical",
    priority: "low",
    status: "Scheduled",
  },
  {
    cleaner: { initials: "MG", name: "Maria Garcia",  gradientFrom: "#F6339A", gradientTo: "#E60076" },
    site: "Site B",
    area: "Conference Room",
    time: "09:00",
    category: "Work Order",
    priority: "high",
    status: "Active",
  },
  {
    cleaner: { initials: "CW", name: "Chen Wei",      gradientFrom: "#00BC7D", gradientTo: "#009966" },
    site: "Site C",
    area: "Break Room",
    time: "14:00",
    category: "General Cleaning",
    priority: "medium",
    status: "Scheduled",
  },
  {
    cleaner: { initials: "SJ", name: "Sarah Johnson", gradientFrom: "#FE9A00", gradientTo: "#E17100" },
    site: "Site B",
    area: "Main Entrance",
    time: "08:30",
    category: "General Cleaning",
    priority: "medium",
    status: "Active",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WorkforcePage() {
  const [newAssignmentOpen, setNewAssignmentOpen] = useState(false);
  const [defaultDate, setDefaultDate] = useState<Date | undefined>();
  const [defaultTime, setDefaultTime] = useState<string>("");

  function handleCalendarSlotClick(date: Date, time: string) {
    setDefaultDate(date);
    setDefaultTime(time);
    setNewAssignmentOpen(true);
  }

  function handleNewAssignmentButton() {
    setDefaultDate(new Date());
    setDefaultTime("09:00");
    setNewAssignmentOpen(true);
  }

  function handleAssignmentSubmit(data: AssignmentFormData) {
    console.log("New assignment:", data);
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Page header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-on-surface">Workforce &amp; Management</h1>
            <p className="mt-1 text-sm text-grey-500">Site A operational view</p>
          </div>
          <button
            type="button"
            onClick={handleNewAssignmentButton}
            className="shrink-0 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            + New Assignment
          </button>
        </div>

        {/* Stats row */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {WORKFORCE_STATS.map((stat) => (
            <AdminStatCard key={stat.label} {...stat} />
          ))}
        </div>

        {/* Active Tasks */}
        <div className="mb-6">
          <h2 className="mb-3 text-base font-semibold text-on-surface">Active Tasks</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {ACTIVE_TASKS.map((task, i) => (
              <ActiveTaskCard key={i} {...task} />
            ))}
          </div>
        </div>

        {/* Calendar */}
        <WorkforceCalendar onNewAssignment={handleCalendarSlotClick} />
      </div>

      {/* New Assignment Modal */}
      <NewAssignmentModal
        open={newAssignmentOpen}
        onClose={() => setNewAssignmentOpen(false)}
        onSubmit={handleAssignmentSubmit}
        defaultDate={defaultDate}
        defaultTime={defaultTime}
      />
    </div>
  );
}
