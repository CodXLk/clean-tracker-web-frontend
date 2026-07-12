"use client";

import {
  Users2,
  ClipboardCheck,
  MessageSquare,
  Package,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { cn } from "@/lib/utils/cn";

// ── Static data ───────────────────────────────────────────────────────────────

interface SiteData {
  name: string;
  cleaners: number;
  tasks: number;
  active: boolean;
}

const SITES: SiteData[] = [
  { name: "Site A", cleaners: 12, tasks: 45, active: true },
  { name: "Site B", cleaners: 8,  tasks: 32, active: false },
  { name: "Site C", cleaners: 15, tasks: 67, active: false },
  { name: "Site D", cleaners: 20, tasks: 89, active: false },
];

interface KpiData {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  value: string | number;
  label: string;
  badge: string;
  badgeColor: string;
}

const KPIS: KpiData[] = [
  {
    icon: Users2,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    value: 12,
    label: "Active Cleaners",
    badge: "+2",
    badgeColor: "text-primary",
  },
  {
    icon: ClipboardCheck,
    iconBg: "bg-[#ED5F25]/10",
    iconColor: "text-[#ED5F25]",
    value: 5,
    label: "Pending Inspections",
    badge: "-1",
    badgeColor: "text-success",
  },
  {
    icon: MessageSquare,
    iconBg: "bg-success/10",
    iconColor: "text-success",
    value: 3,
    label: "Open Complaints",
    badge: "0",
    badgeColor: "text-grey-500",
  },
  {
    icon: Package,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    value: 8,
    label: "Pending Deliveries",
    badge: "+3",
    badgeColor: "text-[#ED5F25]",
  },
];

interface ActivityItem {
  type: string;
  text: string;
  time: string;
  dotColor: string;
}

const RECENT_ACTIVITY: ActivityItem[] = [
  {
    type: "Inspection",
    text: "Site A - Floor 3 - Meeting Room",
    time: "2 hours ago",
    dotColor: "bg-primary",
  },
  {
    type: "Complaint",
    text: "Site A - Restroom cleaning issue",
    time: "4 hours ago",
    dotColor: "bg-[#ED5F25]",
  },
  {
    type: "Delivery",
    text: "Site B - Supplies delivery",
    time: "6 hours ago",
    dotColor: "bg-success",
  },
];

interface InspectionItem {
  title: string;
  priority: string;
  site: string;
  priorityColor: string;
}

const PENDING_INSPECTIONS: InspectionItem[] = [
  {
    title: "Inspect cleaned floors in Site B",
    priority: "High Priority",
    site: "Site B",
    priorityColor: "text-[#ED5F25]",
  },
  {
    title: "Assign cleaner for weekend shift",
    priority: "Medium Priority",
    site: "Site A",
    priorityColor: "text-primary",
  },
  {
    title: "Approve delivery request for sanitizers",
    priority: "High Priority",
    site: "Site C",
    priorityColor: "text-[#ED5F25]",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-on-surface">Dashboard</h1>
          <p className="mt-1 text-sm text-grey-500">Site A operational view</p>
        </div>

        {/* All Sites Overview */}
        <div className="mb-6 rounded-2xl bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Building2 size={20} className="text-on-surface" aria-hidden="true" />
            <h2 className="text-base font-semibold text-on-surface">All Sites Overview</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {SITES.map((site) => (
              <div
                key={site.name}
                className={cn(
                  "rounded-xl border p-4 transition-colors",
                  site.active
                    ? "border-primary bg-primary/5"
                    : "border-grey-300 bg-surface",
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-on-surface">{site.name}</span>
                  {site.active && (
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                      Active
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-grey-500">
                    Cleaners:{" "}
                    <span className="font-medium text-on-surface">{site.cleaners}</span>
                  </p>
                  <p className="text-sm text-grey-500">
                    Tasks:{" "}
                    <span className="font-medium text-primary">{site.tasks}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* KPI stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {KPIS.map((kpi) => (
            <AdminStatCard key={kpi.label} {...kpi} />
          ))}
        </div>

        {/* Bottom two columns */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <div className="rounded-2xl bg-surface p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-on-surface">Recent Activity</h2>
            <div className="flex flex-col gap-4">
              {RECENT_ACTIVITY.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", item.dotColor)} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-grey-500">{item.type}</span>
                      <span className="shrink-0 text-xs text-grey-500">{item.time}</span>
                    </div>
                    <p className="mt-0.5 text-sm font-medium text-on-surface">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Inspections */}
          <div className="rounded-2xl bg-surface p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-primary">Pending Inspections</h2>
            <div className="flex flex-col gap-4">
              {PENDING_INSPECTIONS.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                      item.priorityColor === "text-primary" ? "bg-primary/10" : "bg-[#ED5F25]/10",
                    )}
                    aria-hidden="true"
                  >
                    <ClipboardCheck
                      size={16}
                      className={item.priorityColor}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-on-surface">{item.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={cn("text-xs font-medium", item.priorityColor)}>
                        {item.priority}
                      </span>
                      <span className="rounded-full bg-grey-100 px-2 py-0.5 text-xs text-grey-700">
                        {item.site}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
