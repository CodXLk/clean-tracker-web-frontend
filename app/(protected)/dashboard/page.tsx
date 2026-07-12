"use client";

import { useState } from "react";
import { Bell, Calendar, Clock, ClipboardList, AlertTriangle } from "lucide-react";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { CheckInBadge } from "@/components/shared/CheckInBadge";
import { SlideButton } from "@/components/shared/SlideButton";
import { cn } from "@/lib/utils/cn";

interface KpiCardData {
  label:  string;
  value:  string | number;
  color:  "orange" | "green" | "grey";
}

const TASK_KPIS: KpiCardData[] = [
  { label: "Pending",   value: 2, color: "orange" },
  { label: "Completed", value: 1, color: "green"  },
  { label: "Total",     value: 3, color: "grey"   },
];

interface ComplaintAlert {
  id:       string;
  title:    string;
  location: string;
}

const COMPLAINT_ALERTS: ComplaintAlert[] = [
  { id: "1", title: "Restroom cleaning issue", location: "Floor 2 - Restrooms"   },
  { id: "2", title: "Trash not collected",      location: "Floor 3 - Office Area" },
];

interface UpcomingShift {
  id:       string;
  date:     string;
  site:     string;
  timeRange: string;
}

const UPCOMING_SHIFTS: UpcomingShift[] = [
  { id: "1", date: "Tomorrow, Apr 10", site: "Site A",  timeRange: "08:00 – 16:00" },
  { id: "2", date: "Thu, Apr 11",      site: "Site B",  timeRange: "09:00 – 17:00" },
];

export default function DashboardPage() {
  const [checkedIn, setCheckedIn] = useState(false);

  function handleCheckIn() {
    setCheckedIn(true);
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at top left, rgba(71,114,115,0.18) 0%, transparent 60%), #F5F5F5",
      }}
    >
      {/* Header */}
      <header className="bg-primary rounded-b-[40px] px-5 pt-14 pb-8">
        <div className="flex items-center justify-between">
          {/* Left: avatar + greeting */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 shrink-0 rounded-full bg-grey-300" aria-label="User avatar" />
            <div>
              <p className="text-xs text-white/70">Good morning</p>
              <p className="text-lg font-bold text-white leading-tight">Hello, Peter 👋</p>
              <CheckInBadge
                checkedIn={checkedIn}
                checkInTime={checkedIn ? "09:30" : undefined}
                className="mt-1"
              />
            </div>
          </div>

          {/* Bell */}
          <button
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition-opacity hover:opacity-80"
          >
            <Bell size={20} strokeWidth={2} />
            <span
              aria-hidden="true"
              className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-danger border-2 border-primary"
            />
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-2xl px-5 pb-28 lg:max-w-5xl mt-5">
        <div className="lg:grid lg:grid-cols-2 lg:gap-6">
          {/* Left column */}
          <div className="flex flex-col gap-6">
            {/* Attendance section */}
            <section
              aria-labelledby="attendance-heading"
              className="flex flex-col gap-3 rounded-3xl bg-white/60 p-5 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-primary" />
                  <h2
                    id="attendance-heading"
                    className="text-sm font-semibold text-on-surface"
                  >
                    Attendance
                  </h2>
                </div>
                <button className="text-sm text-primary hover:underline">
                  Choose check-in method
                </button>
              </div>
              <SlideButton
                label={checkedIn ? "Checked In" : "Slide to Check In"}
                variant="teal"
                onComplete={handleCheckIn}
                completedLabel="Checked In"
                disabled={checkedIn}
              />
            </section>

            {/* Today's Tasks KPI */}
            <section
              aria-labelledby="tasks-heading"
              className="rounded-3xl bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList size={18} className="text-primary" />
                  <h2
                    id="tasks-heading"
                    className="text-sm font-semibold text-on-surface"
                  >
                    Today&apos;s Tasks
                  </h2>
                </div>
                <span className="rounded-full bg-[#ED5F25]/20 px-3 py-0.5 text-xs font-semibold text-[#ED5F25]">
                  3 Tasks
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {TASK_KPIS.map((kpi) => (
                  <KpiCard key={kpi.label} {...kpi} />
                ))}
              </div>
            </section>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6 mt-6 lg:mt-0">
            {/* Complaints Alert */}
            <section
              aria-labelledby="complaints-heading"
              className="rounded-3xl bg-gradient-to-br from-red-50 to-red-100 p-5 shadow-sm border border-red-200"
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-danger/10">
                  <AlertTriangle size={18} className="text-danger" />
                </div>
                <div>
                  <h2
                    id="complaints-heading"
                    className="text-sm font-bold text-danger"
                  >
                    Complaints Alert
                  </h2>
                  <p className="text-xs text-grey-700 leading-snug">
                    You have 2 new complaints that require immediate attention
                  </p>
                </div>
              </div>

              <div className="mb-4 flex flex-col gap-2">
                {COMPLAINT_ALERTS.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-red-200 bg-white/60 px-3 py-2.5"
                  >
                    <p className="text-xs font-semibold text-on-surface">{c.title}</p>
                    <p className="text-xs text-grey-500">{c.location}</p>
                  </div>
                ))}
              </div>

              <button className="w-full rounded-2xl bg-gradient-to-r from-danger to-red-600 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90">
                View All Complaints
              </button>
            </section>

            {/* Upcoming Shifts */}
            <section
              aria-labelledby="shifts-heading"
              className="rounded-3xl border border-white/20 bg-white/40 p-5 shadow-sm backdrop-blur-sm"
            >
              <div className="mb-3 flex items-center gap-2">
                <Calendar size={18} className="text-primary" />
                <h2
                  id="shifts-heading"
                  className="text-sm font-semibold text-on-surface"
                >
                  Upcoming Shifts
                </h2>
              </div>
              <div className="flex flex-col gap-2">
                {UPCOMING_SHIFTS.map((shift) => (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between rounded-2xl bg-white/40 px-4 py-3"
                  >
                    <div>
                      <p className="text-xs font-semibold text-on-surface">{shift.date}</p>
                      <p className="text-xs text-grey-500">{shift.site}</p>
                    </div>
                    <span className="text-xs font-semibold text-primary">{shift.timeRange}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      <BottomNavBar />
    </div>
  );
}

/* ── KPI Card sub-component ───────────────────────────────────────────────── */

interface KpiCardProps {
  label: string;
  value: string | number;
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
