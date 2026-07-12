"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { PageHeader } from "@/components/shared/PageHeader";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { ComplaintDetailModal } from "@/components/modals/ComplaintDetailModal";
import type { ComplaintDetailState } from "@/components/modals/ComplaintDetailModal";
import type { Priority } from "@/components/shared/PriorityBadge";
import { cn } from "@/lib/utils/cn";

type ComplaintStatus = "open" | "in_progress" | "resolved" | "closed";
type FilterOption    = "All" | "Open" | "In progress" | "Resolved";

const FILTER_OPTIONS: FilterOption[] = ["All", "Open", "In progress", "Resolved"];

interface Complaint {
  id:       string;
  title:    string;
  location: string;
  ticket:   string;
  priority: Priority;
  status:   ComplaintStatus;
  date:     string;
}

const COMPLAINTS: Complaint[] = [
  {
    id:       "1",
    title:    "Restroom cleaning issue",
    location: "Floor 2 - Restrooms",
    ticket:   "#C-1247",
    priority: "high",
    status:   "in_progress",
    date:     "2026-04-10",
  },
  {
    id:       "2",
    title:    "Trash not collected",
    location: "Floor 3 - Office Area",
    ticket:   "#C-1246",
    priority: "medium",
    status:   "resolved",
    date:     "2026-04-09",
  },
  {
    id:       "3",
    title:    "Floor needs polishing",
    location: "Floor 1 - Lobby",
    ticket:   "#C-1245",
    priority: "low",
    status:   "open",
    date:     "2026-04-11",
  },
];

const STATUS_LABEL_MAP: Record<ComplaintStatus, string> = {
  open:        "Open",
  in_progress: "In Progress",
  resolved:    "Resolved",
  closed:      "Closed",
};

const STATUS_COLOR_MAP: Record<ComplaintStatus, string> = {
  open:        "bg-[#ED5F25]/20 text-[#ED5F25]",
  in_progress: "bg-primary/20 text-primary",
  resolved:    "bg-success/20 text-success",
  closed:      "bg-grey-300 text-grey-700",
};

function getModalState(status: ComplaintStatus): ComplaintDetailState {
  if (status === "resolved") return "completed";
  return status;
}

function getStatusIcon(status: ComplaintStatus) {
  if (status === "resolved") {
    return <CheckCircle size={18} className="text-success" />;
  }
  if (status === "in_progress") {
    return <Clock size={18} className="text-primary" />;
  }
  return <AlertCircle size={18} className="text-[#ED5F25]" />;
}

function getIconBg(status: ComplaintStatus): string {
  if (status === "resolved")   return "bg-success/10";
  if (status === "in_progress") return "bg-primary/10";
  return "bg-[#ED5F25]/10";
}

const KPI_CARDS = [
  { label: "Total",     value: "03", color: "grey"   as const },
  { label: "Pending",   value: "03", color: "orange" as const },
  { label: "Completed", value: "00", color: "green"  as const },
];

export default function ComplaintsPage() {
  const [activeFilter,       setActiveFilter]       = useState<FilterOption>("All");
  const [selectedComplaint,  setSelectedComplaint]  = useState<Complaint | null>(null);

  const filtered = COMPLAINTS.filter((c) => {
    if (activeFilter === "All")         return true;
    if (activeFilter === "Open")        return c.status === "open";
    if (activeFilter === "In progress") return c.status === "in_progress";
    if (activeFilter === "Resolved")    return c.status === "resolved";
    return true;
  });

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at top left, rgba(71,114,115,0.18) 0%, transparent 60%), #F5F5F5",
      }}
    >
      <PageHeader title="Complaints" />

      <main className="mx-auto max-w-2xl px-5 pb-28 lg:max-w-5xl -mt-5">
        {/* KPI row */}
        <div className="mb-5 grid grid-cols-3 gap-3 pt-5">
          {KPI_CARDS.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>

        {/* Filter tabs */}
        <div className="mb-4">
          <FilterTabs
            options={FILTER_OPTIONS}
            value={activeFilter}
            onChange={setActiveFilter}
          />
        </div>

        {/* Complaint list */}
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2">
          {filtered.length === 0 ? (
            <p className="col-span-2 py-8 text-center text-sm text-grey-500">
              No complaints found.
            </p>
          ) : (
            filtered.map((complaint) => (
              <button
                key={complaint.id}
                onClick={() => setSelectedComplaint(complaint)}
                className="flex w-full rounded-2xl bg-white p-4 shadow-sm text-left gap-3 transition-shadow hover:shadow-md"
              >
                {/* Status icon circle */}
                <div
                  className={cn(
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    getIconBg(complaint.status),
                  )}
                >
                  {getStatusIcon(complaint.status)}
                </div>

                {/* Content */}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-on-surface leading-snug">
                      {complaint.title}
                    </span>
                    <PriorityBadge priority={complaint.priority} />
                  </div>
                  <span className="text-xs text-grey-500">{complaint.location}</span>
                  <span className="text-xs text-grey-500">{complaint.ticket}</span>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "rounded-xl px-2.5 py-0.5 text-xs font-medium",
                        STATUS_COLOR_MAP[complaint.status],
                      )}
                    >
                      {STATUS_LABEL_MAP[complaint.status]}
                    </span>
                    <span className="text-xs text-grey-500">{complaint.date}</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </main>

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <ComplaintDetailModal
          open={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title={selectedComplaint.title}
          location={selectedComplaint.location}
          ticketId={selectedComplaint.ticket}
          state={getModalState(selectedComplaint.status)}
          onStartWorking={() => setSelectedComplaint(null)}
          onUploadPhoto={() => {}}
          onMarkComplete={() => setSelectedComplaint(null)}
        />
      )}

      <BottomNavBar />
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: string;
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
