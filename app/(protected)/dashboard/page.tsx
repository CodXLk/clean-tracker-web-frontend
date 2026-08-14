"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Bell, Calendar, Clock, AlertTriangle, MapPin, CheckCircle2, X } from "lucide-react";
import { useIsDrawerNav } from "@/components/layout/AppNav";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { CheckInBadge } from "@/components/shared/CheckInBadge";
import { CheckInPanel } from "@/features/attendance/components/CheckInPanel";
import { useMySites } from "@/features/attendance/hooks/useAttendance";
import { useMe } from "@/features/auth/hooks/useMe";
import { useMyTasks } from "@/features/tasks/hooks/useTasks";
import { useComplaints } from "@/features/complaints/hooks/useComplaints";
import { useUnreadCount } from "@/features/notifications/hooks/useNotifications";
import { formatTaskTime, toLocalDateString } from "@/features/tasks/lib/task-utils";
import type { TaskOccurrence } from "@/features/tasks/schemas/task.schema";
import { cn } from "@/lib/utils/cn";

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

interface UpcomingShift {
  id: string;
  date: string;
  site: string;
  timeRange: string;
  locations: string[];
}

// Group future task occurrences into one "shift" per site per day.
function buildUpcomingShifts(occurrences: TaskOccurrence[]): UpcomingShift[] {
  const byKey = new Map<
    string,
    { date: string; site: string; start?: string; end?: string; locations: Set<string> }
  >();
  for (const o of occurrences) {
    const key = `${o.date}__${o.siteId}`;
    const group = byKey.get(key) ?? { date: o.date, site: o.siteName, locations: new Set<string>() };
    if (o.startTime && (!group.start || o.startTime < group.start)) group.start = o.startTime;
    if (o.endTime && (!group.end || o.endTime > group.end)) group.end = o.endTime;
    const loc = [o.floorName, o.areaName].filter(Boolean).join(" · ");
    if (loc) group.locations.add(loc);
    byKey.set(key, group);
  }

  return Array.from(byKey.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(0, 4)
    .map(([key, g]) => {
      const label = new Date(`${g.date}T00:00:00`).toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      const start = formatTaskTime(g.start);
      const end = formatTaskTime(g.end);
      const timeRange = start && end ? `${start} – ${end}` : start ?? "All day";
      return { id: key, date: label, site: g.site, timeRange, locations: Array.from(g.locations) };
    });
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const [adminDeniedDismissed, setAdminDeniedDismissed] = useState(false);
  const showAdminDeniedBanner = searchParams.get("denied") === "admin" && !adminDeniedDismissed;

  const { data: sites = [], isLoading } = useMySites();
  const { data: me } = useMe();
  const useDrawerNav = useIsDrawerNav();

  const today = useMemo(() => toLocalDateString(new Date()), []);
  const range = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() + 1);
    const end = new Date();
    end.setDate(end.getDate() + 7);
    return { from: toLocalDateString(start), to: toLocalDateString(end) };
  }, []);

  const { data: todayTasks = [] } = useMyTasks(today);
  const { data: upcomingTasks = [] } = useMyTasks(range.from, range.to);
  const { data: complaintsData } = useComplaints();
  const { data: unreadCount = 0 } = useUnreadCount();

  const activeSite = sites.find((s) => s.status === "CHECKED_IN");
  const checkedIn = !!activeSite;
  const checkInTime = activeSite?.checkInAt
    ? new Date(activeSite.checkInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
    : undefined;

  const greeting = greetingFor(new Date().getHours());
  const firstName = me?.firstName?.trim() || "there";

  const siteKpis = useMemo(() => {
    // Roll today's tasks up per site: a site is "completed" only when all its tasks are done.
    const map = new Map<string, { total: number; done: number }>();
    for (const o of todayTasks) {
      if (!o.siteId) continue;
      const g = map.get(o.siteId) ?? { total: 0, done: 0 };
      g.total += 1;
      if (o.status === "COMPLETED" || o.status === "CANCELLED") g.done += 1;
      map.set(o.siteId, g);
    }
    let completed = 0;
    for (const g of map.values()) if (g.total > 0 && g.done === g.total) completed += 1;
    const total = map.size;
    return { total, completed, pending: total - completed };
  }, [todayTasks]);

  const openComplaints = useMemo(
    () => (complaintsData?.complaints ?? []).filter((c) => c.status === "open"),
    [complaintsData],
  );

  const upcomingShifts = useMemo(() => buildUpcomingShifts(upcomingTasks), [upcomingTasks]);

  return (
    <>
      {/* ---------- Desktop (admin-style console) ---------- */}
      <div className={cn("p-6 lg:p-8", useDrawerNav ? "block" : "hidden lg:block")}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <p className="text-sm text-grey-500">
              {greeting}, {firstName} — here&apos;s what&apos;s happening today.
            </p>
          </div>

          {showAdminDeniedBanner && (
            <div className="mb-6 flex items-start justify-between gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-on-surface">
              <p>Your account doesn&apos;t have access to the admin console, so you were brought here instead.</p>
              <button
                type="button"
                onClick={() => setAdminDeniedDismissed(true)}
                aria-label="Dismiss"
                className="shrink-0 rounded-full p-1 text-on-surface/60 transition-opacity hover:opacity-80"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>
          )}

          <div className="mb-6 grid grid-cols-4 gap-2 sm:gap-4">
            <AdminStatCard
              icon={MapPin}
              iconBg="bg-primary/10"
              iconColor="text-primary"
              value={siteKpis.total}
              label="Total Sites"
            />
            <AdminStatCard
              icon={Clock}
              iconBg="bg-[#ED5F25]/10"
              iconColor="text-[#ED5F25]"
              value={siteKpis.pending}
              label="Pending Sites"
            />
            <AdminStatCard
              icon={CheckCircle2}
              iconBg="bg-success/10"
              iconColor="text-success"
              value={siteKpis.completed}
              label="Completed Sites"
            />
            <AdminStatCard
              icon={AlertTriangle}
              iconBg={openComplaints.length > 0 ? "bg-danger/10" : "bg-success/10"}
              iconColor={openComplaints.length > 0 ? "text-danger" : "text-success"}
              value={openComplaints.length}
              label="Open Complaints"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section aria-labelledby="attendance-heading" className="rounded-2xl bg-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Clock size={18} className="text-primary" aria-hidden="true" />
                <h2 id="attendance-heading" className="text-sm font-semibold text-on-surface">
                  Attendance
                </h2>
              </div>
              <CheckInPanel sites={sites} isLoading={isLoading} />
            </section>

            <section aria-labelledby="complaints-heading" className="rounded-2xl bg-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle
                  size={18}
                  className={openComplaints.length > 0 ? "text-danger" : "text-success"}
                  aria-hidden="true"
                />
                <h2 id="complaints-heading" className="text-sm font-semibold text-on-surface">
                  Complaints Alert
                </h2>
              </div>
              {openComplaints.length > 0 ? (
                <>
                  <div className="mb-4 flex flex-col gap-2">
                    {openComplaints.slice(0, 3).map((c) => {
                      const location = [c.floor, c.area].filter(Boolean).join(" · ");
                      return (
                        <div key={c.id} className="rounded-xl border border-grey-200 bg-grey-50 px-3 py-2.5">
                          <p className="text-xs font-semibold text-on-surface">{c.title}</p>
                          {location && <p className="text-xs text-grey-500">{location}</p>}
                        </div>
                      );
                    })}
                  </div>
                  <Link
                    href="/admin/complaints"
                    className="block w-full rounded-xl bg-danger py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    View All Complaints
                  </Link>
                </>
              ) : (
                <p className="text-sm text-grey-500">No open complaints right now.</p>
              )}
            </section>

            <section aria-labelledby="shifts-heading" className="rounded-2xl bg-surface p-5 shadow-sm lg:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-primary" aria-hidden="true" />
                <h2 id="shifts-heading" className="text-sm font-semibold text-on-surface">
                  Upcoming Shifts
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {upcomingShifts.length === 0 ? (
                  <p className="rounded-xl bg-grey-50 px-4 py-3 text-center text-xs text-grey-500 sm:col-span-2">
                    No upcoming shifts scheduled.
                  </p>
                ) : (
                  upcomingShifts.map((shift) => (
                    <div key={shift.id} className="flex items-start justify-between gap-3 rounded-xl bg-grey-50 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-on-surface">{shift.date}</p>
                        <p className="text-xs text-grey-500">{shift.site}</p>
                        {shift.locations.length > 0 && (
                          <p className="mt-0.5 truncate text-[11px] text-grey-500">
                            {shift.locations.slice(0, 3).join(", ")}
                            {shift.locations.length > 3 ? ` +${shift.locations.length - 3}` : ""}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-primary">{shift.timeRange}</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* ---------- Mobile (cleaner-style layout) ---------- */}
      <div
        className={cn("min-h-screen", useDrawerNav ? "hidden" : "lg:hidden")}
        style={{
          background:
            "radial-gradient(ellipse at top left, rgba(71,114,115,0.18) 0%, transparent 60%), #F5F5F5",
        }}
      >
        {/* Header — only when the nav has ≤5 items; otherwise the shared
            admin-style top bar (AppShell) covers the title/bell. */}
        {!useDrawerNav && (
          <header className="bg-primary rounded-b-[40px] px-5 pt-8 pb-8">
            <div className="flex items-center justify-between">
              {/* Left: avatar + greeting */}
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 rounded-full bg-grey-300" aria-label="User avatar" />
                <div>
                  <p className="text-xs text-white/70">{greeting}</p>
                  <p className="text-lg font-bold text-white leading-tight">Hello, {firstName} 👋</p>
                  <CheckInBadge
                    checkedIn={checkedIn}
                    checkInTime={checkInTime ?? undefined}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Bell */}
              <Link
                href="/dashboard/notifications"
                aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition-opacity hover:opacity-80"
              >
                <Bell size={20} strokeWidth={2} />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white ring-2 ring-primary">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            </div>
          </header>
        )}

        {/* Body */}
        <main className="mx-auto max-w-2xl px-5 pb-28 mt-5">
          {showAdminDeniedBanner && (
            <div className="mb-5 flex items-start justify-between gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-on-surface">
              <p>Your account doesn&apos;t have access to the admin console, so you were brought here instead.</p>
              <button
                type="button"
                onClick={() => setAdminDeniedDismissed(true)}
                aria-label="Dismiss"
                className="shrink-0 rounded-full p-1 text-on-surface/60 transition-opacity hover:opacity-80"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>
          )}
          <div className="flex flex-col gap-6">
            {/* Attendance section */}
            <section
              aria-labelledby="attendance-heading-mobile"
              className="flex flex-col gap-3 rounded-3xl bg-white/60 p-5 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-primary" />
                  <h2
                    id="attendance-heading-mobile"
                    className="text-sm font-semibold text-on-surface"
                  >
                    Attendance
                  </h2>
                </div>
              </div>

              <CheckInPanel sites={sites} isLoading={isLoading} />
            </section>

            {/* Today's Sites KPI */}
            <section
              aria-labelledby="tasks-heading-mobile"
              className="rounded-3xl bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-primary" />
                  <h2
                    id="tasks-heading-mobile"
                    className="text-sm font-semibold text-on-surface"
                  >
                    Today&apos;s Sites
                  </h2>
                </div>
                <span className="rounded-full bg-[#ED5F25]/20 px-3 py-0.5 text-xs font-semibold text-[#ED5F25]">
                  {siteKpis.total} {siteKpis.total === 1 ? "Site" : "Sites"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Link href="/dashboard/tasks" className="block transition-opacity hover:opacity-80">
                  <KpiCard label="Total" value={siteKpis.total} color="teal" />
                </Link>
                <Link href="/dashboard/tasks" className="block transition-opacity hover:opacity-80">
                  <KpiCard label="Pending" value={siteKpis.pending} color="orange" />
                </Link>
                <Link href="/dashboard/tasks" className="block transition-opacity hover:opacity-80">
                  <KpiCard label="Completed" value={siteKpis.completed} color="green" />
                </Link>
              </div>
            </section>

            {/* Complaints Alert */}
            <section
              aria-labelledby="complaints-heading-mobile"
              className={cn(
                "rounded-3xl p-5 shadow-sm border",
                openComplaints.length > 0
                  ? "bg-gradient-to-br from-red-50 to-red-100 border-red-200"
                  : "bg-white/60 border-white/20",
              )}
            >
              <div className="mb-3 flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    openComplaints.length > 0 ? "bg-danger/10" : "bg-success/10",
                  )}
                >
                  <AlertTriangle
                    size={18}
                    className={openComplaints.length > 0 ? "text-danger" : "text-success"}
                  />
                </div>
                <div>
                  <h2
                    id="complaints-heading-mobile"
                    className={cn(
                      "text-sm font-bold",
                      openComplaints.length > 0 ? "text-danger" : "text-on-surface",
                    )}
                  >
                    Complaints Alert
                  </h2>
                  <p className="text-xs text-grey-700 leading-snug">
                    {openComplaints.length > 0
                      ? `You have ${openComplaints.length} open ${
                          openComplaints.length === 1 ? "complaint" : "complaints"
                        } that require attention`
                      : "No open complaints right now"}
                  </p>
                </div>
              </div>

              {openComplaints.length > 0 && (
                <div className="mb-4 flex flex-col gap-2">
                  {openComplaints.slice(0, 3).map((c) => {
                    const location = [c.floor, c.area].filter(Boolean).join(" · ");
                    return (
                      <div
                        key={c.id}
                        className="rounded-xl border border-red-200 bg-white/60 px-3 py-2.5"
                      >
                        <p className="text-xs font-semibold text-on-surface">{c.title}</p>
                        {location && <p className="text-xs text-grey-500">{location}</p>}
                      </div>
                    );
                  })}
                </div>
              )}

              <Link
                href="/admin/complaints"
                className="block w-full rounded-2xl bg-gradient-to-r from-danger to-red-600 py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                View All Complaints
              </Link>
            </section>

            {/* Upcoming Shifts */}
            <section
              aria-labelledby="shifts-heading-mobile"
              className="rounded-3xl border border-white/20 bg-white/40 p-5 shadow-sm backdrop-blur-sm"
            >
              <div className="mb-3 flex items-center gap-2">
                <Calendar size={18} className="text-primary" />
                <h2
                  id="shifts-heading-mobile"
                  className="text-sm font-semibold text-on-surface"
                >
                  Upcoming Shifts
                </h2>
              </div>
              <div className="flex flex-col gap-2">
                {upcomingShifts.length === 0 ? (
                  <p className="rounded-2xl bg-white/40 px-4 py-3 text-center text-xs text-grey-500">
                    No upcoming shifts scheduled.
                  </p>
                ) : (
                  upcomingShifts.map((shift) => (
                    <div
                      key={shift.id}
                      className="flex items-start justify-between gap-3 rounded-2xl bg-white/40 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-on-surface">{shift.date}</p>
                        <p className="text-xs text-grey-500">{shift.site}</p>
                        {shift.locations.length > 0 && (
                          <p className="mt-0.5 truncate text-[11px] text-grey-500">
                            {shift.locations.slice(0, 3).join(", ")}
                            {shift.locations.length > 3 ? ` +${shift.locations.length - 3}` : ""}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-primary">{shift.timeRange}</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}

/* ── KPI Card sub-component ───────────────────────────────────────────────── */

interface KpiCardProps {
  label: string;
  value: string | number;
  color: "orange" | "green" | "grey" | "teal";
}

function KpiCard({ label, value, color }: KpiCardProps) {
  const colorMap = {
    orange: "text-[#ED5F25] bg-[#ED5F25]/10",
    green:  "text-success bg-success/10",
    grey:   "text-grey-700 bg-grey-100",
    teal:   "text-primary bg-primary/10",
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
