"use client";

import { useMemo, useState } from "react";
import { Users2, Calendar, Star, Building2, type LucideIcon } from "lucide-react";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { ActiveTaskCard } from "@/components/admin/ActiveTaskCard";
import { WorkforceCalendar } from "@/components/admin/WorkforceCalendar";
import { NewAssignmentModal } from "@/components/admin/NewAssignmentModal";
import { useWorkforceStats, useTaskAssignments } from "@/features/workforce/hooks/useTaskAssignments";
import { ASSIGNMENT_TYPE_LABELS, type TaskAssignment } from "@/features/workforce/schemas/assignment.schema";

// ── Helpers ─────────────────────────────────────────────────────────────────────

const CARD_GRADIENTS: Array<{ from: string; to: string }> = [
  { from: "#2B7FFF", to: "#155DFC" },
  { from: "#AD46FF", to: "#9810FA" },
  { from: "#F6339A", to: "#E60076" },
  { from: "#00BC7D", to: "#009966" },
  { from: "#FE9A00", to: "#E17100" },
];

interface WorkforceStatData {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  value: string | number;
  label: string;
  badge: string;
  badgeColor: string;
}

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function initialsOf(first?: string | null, last?: string | null): string {
  const a = first?.trim()?.[0] ?? "";
  const b = last?.trim()?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

function cleanerNameOf(first?: string | null, last?: string | null): string {
  return [first, last].filter(Boolean).join(" ").trim() || "Unassigned";
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WorkforcePage() {
  const [newAssignmentOpen, setNewAssignmentOpen] = useState(false);
  const [defaultDate, setDefaultDate] = useState<Date | undefined>();
  const [defaultTime, setDefaultTime] = useState<string>("");

  const today = todayString();
  const statsQuery = useWorkforceStats();
  const todaysQuery = useTaskAssignments({ from: today, to: today });

  const stats: WorkforceStatData[] = useMemo(() => {
    const s = statsQuery.data;
    return [
      {
        icon: Users2,
        iconBg: "bg-primary/10",
        iconColor: "text-primary",
        value: s?.activeCleaners ?? "—",
        label: "Active Cleaners",
        badge: "",
        badgeColor: "text-primary",
      },
      {
        icon: Calendar,
        iconBg: "bg-[#ED5F25]/10",
        iconColor: "text-[#ED5F25]",
        value: s?.todaysTasks ?? "—",
        label: "Today's Tasks",
        badge: "",
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
        value: s?.sitesManaged ?? "—",
        label: "Sites Managed",
        badge: "",
        badgeColor: "text-grey-500",
      },
    ];
  }, [statsQuery.data]);

  // Today's tasks that are currently running or still upcoming, earliest first.
  const activeTasks = useMemo(() => {
    const list = todaysQuery.data ?? [];
    const now = nowMinutes();
    return list
      .filter((t) => t.scheduledDate === today && timeToMinutes(t.endTime) > now)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }, [todaysQuery.data, today]);

  function statusOf(task: TaskAssignment): "Active" | "Scheduled" {
    const now = nowMinutes();
    return timeToMinutes(task.startTime) <= now && now < timeToMinutes(task.endTime)
      ? "Active"
      : "Scheduled";
  }

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

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Page header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-on-surface">Workforce &amp; Management</h1>
            <p className="mt-1 text-sm text-grey-500">Operational view</p>
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
          {stats.map((stat) => (
            <AdminStatCard key={stat.label} {...stat} />
          ))}
        </div>

        {/* Active Tasks */}
        <div className="mb-6">
          <h2 className="mb-3 text-base font-semibold text-on-surface">Active Tasks</h2>
          {todaysQuery.isLoading ? (
            <p className="text-sm text-grey-500">Loading tasks…</p>
          ) : activeTasks.length === 0 ? (
            <p className="text-sm text-grey-500">No active or upcoming tasks for today.</p>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {activeTasks.map((task, i) => {
                const cleaner = task.cleaners[0];
                const gradient = CARD_GRADIENTS[i % CARD_GRADIENTS.length]!;
                return (
                  <ActiveTaskCard
                    key={task.id}
                    cleaner={{
                      initials: initialsOf(cleaner?.firstName, cleaner?.lastName),
                      name: cleanerNameOf(cleaner?.firstName, cleaner?.lastName),
                      gradientFrom: gradient.from,
                      gradientTo: gradient.to,
                    }}
                    site={task.siteName}
                    area={`${task.floorName} - ${task.areaName}`}
                    time={task.startTime.slice(0, 5)}
                    category={ASSIGNMENT_TYPE_LABELS[task.assignmentType]}
                    priority="medium"
                    status={statusOf(task)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Calendar */}
        <WorkforceCalendar onNewAssignment={handleCalendarSlotClick} />
      </div>

      {/* New Assignment Modal */}
      <NewAssignmentModal
        open={newAssignmentOpen}
        onClose={() => setNewAssignmentOpen(false)}
        defaultDate={defaultDate}
        defaultTime={defaultTime}
      />
    </div>
  );
}
