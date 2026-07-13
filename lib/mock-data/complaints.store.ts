// In-memory mock backend for the Complaints admin page.
// Resets on dev server restart — acceptable since there is no real backend behind this feature yet.

export type ComplaintStatus = "open" | "in_progress" | "resolved" | "closed";
export type ComplaintPriority = "high" | "medium" | "low";

export interface ComplaintTimelineEntry {
  label: string;
  at:    string;
}

export interface ComplaintRecord {
  id:           string;
  code:         string;
  title:        string;
  description:  string;
  floor:        string;
  site:         string;
  status:       ComplaintStatus;
  priority:     ComplaintPriority;
  reporterRole: string;
  reportedAt:   string;
  assignedTo?:  string;
  timeline:     ComplaintTimelineEntry[];
}

let complaints: ComplaintRecord[] = [
  {
    id: "complaint-1247",
    code: "#C-1247",
    title: "Restroom cleaning issue",
    description: "Restrooms not cleaned properly during morning shift",
    floor: "Floor 2 - Restrooms",
    site: "Site A",
    status: "in_progress",
    priority: "high",
    reporterRole: "Building Manager",
    reportedAt: "2026-04-10 · 09:30 AM",
    assignedTo: "Jane Doe",
    timeline: [
      { label: "Complaint submitted",   at: "2026-04-10 at 09:30 AM" },
      { label: "Assigned to Jane Doe",  at: "2026-04-10 at 10:30 AM" },
      { label: "Work in progress",      at: "2026-04-10 at 11:00 AM" },
    ],
  },
  {
    id: "complaint-1246",
    code: "#C-1246",
    title: "Trash not collected",
    description: "Trash bins were full and not emptied yesterday",
    floor: "Floor 3 - Office Area",
    site: "Site A",
    status: "resolved",
    priority: "medium",
    reporterRole: "Employee",
    reportedAt: "2026-04-09 · 02:15 PM",
    assignedTo: "John Smith",
    timeline: [
      { label: "Complaint submitted",  at: "2026-04-09 at 02:15 PM" },
      { label: "Assigned to John Smith", at: "2026-04-09 at 03:00 PM" },
      { label: "Marked as resolved",   at: "2026-04-09 at 05:30 PM" },
    ],
  },
  {
    id: "complaint-1245",
    code: "#C-1245",
    title: "Floor needs polishing",
    description: "Lobby floor appears dull and needs polishing",
    floor: "Floor 1 - Lobby",
    site: "Site B",
    status: "open",
    priority: "low",
    reporterRole: "Reception",
    reportedAt: "2026-04-11 · 11:00 AM",
    timeline: [
      { label: "Complaint submitted", at: "2026-04-11 at 11:00 AM" },
    ],
  },
  {
    id: "complaint-1244",
    code: "#C-1244",
    title: "Window cleaning missed",
    description: "Windows were not cleaned during scheduled periodical cleaning",
    floor: "Floor 5 - Executive Suite",
    site: "Site C",
    status: "closed",
    priority: "medium",
    reporterRole: "Executive Assistant",
    reportedAt: "2026-04-08 · 10:45 AM",
    assignedTo: "Maria Garcia",
    timeline: [
      { label: "Complaint submitted",     at: "2026-04-08 at 10:45 AM" },
      { label: "Assigned to Maria Garcia", at: "2026-04-08 at 11:15 AM" },
      { label: "Marked as resolved",      at: "2026-04-08 at 03:00 PM" },
      { label: "Closed",                  at: "2026-04-08 at 04:00 PM" },
    ],
  },
];

export function getComplaints(): ComplaintRecord[] {
  return complaints;
}

export function getComplaintById(id: string): ComplaintRecord | undefined {
  return complaints.find((c) => c.id === id);
}

export interface CreateComplaintInput {
  title:       string;
  description: string;
  site:        string;
  floor:       string;
  priority:    ComplaintPriority;
  reporterRole: string;
}

export function createComplaint(input: CreateComplaintInput): ComplaintRecord {
  const nextCode = `#C-${1248 + complaints.length}`;
  const record: ComplaintRecord = {
    id: `complaint-${Date.now()}`,
    code: nextCode,
    title: input.title,
    description: input.description,
    floor: input.floor,
    site: input.site,
    status: "open",
    priority: input.priority,
    reporterRole: input.reporterRole,
    reportedAt: new Date().toISOString(),
    timeline: [{ label: "Complaint submitted", at: new Date().toLocaleString() }],
  };
  complaints = [record, ...complaints];
  return record;
}

export function resolveComplaint(id: string): ComplaintRecord | undefined {
  let updated: ComplaintRecord | undefined;
  complaints = complaints.map((c) => {
    if (c.id !== id) return c;
    updated = {
      ...c,
      status: "resolved",
      timeline: [...c.timeline, { label: "Marked as resolved", at: new Date().toLocaleString() }],
    };
    return updated;
  });
  return updated;
}

export function getComplaintKpis() {
  const open       = complaints.filter((c) => c.status === "open").length;
  const inProgress = complaints.filter((c) => c.status === "in_progress").length;
  const resolved   = complaints.filter((c) => c.status === "resolved").length;
  return {
    open,
    inProgress,
    resolved,
    total: complaints.length,
  };
}
