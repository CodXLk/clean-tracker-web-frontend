// In-memory mock backend for the Inspections admin page.
// Resets on dev server restart — acceptable since there is no real backend behind this feature yet.

export interface AreaInspectionRecord {
  id:          string;
  site:        string;
  area:        string;
  reportedAgo: string;
  priority:    "high" | "medium" | "low";
}

export interface MyTaskRecord {
  id:          string;
  site:        string;
  area:        string;
  taskType:    string;
  description: string;
  status:      "pending" | "in_progress" | "completed";
  dueTime:     string;
}

export interface SitePerformanceRecord {
  site:       string;
  completion: number;
  avgTime:    string;
  rating:     number;
}

export interface CleanerRankingRecord {
  rank:            number;
  cleaner:         string;
  site:            string;
  tasksCompleted:  number;
  avgRating:       number;
  onTimeRate:      number;
  performance:     number;
}

let areasNeedingInspection: AreaInspectionRecord[] = [
  { id: "area-1", site: "Site A", area: "Floor 3 - Offices",   reportedAgo: "2 days ago",  priority: "high" },
  { id: "area-2", site: "Site A", area: "Floor 1 - Lobby",     reportedAgo: "1 day ago",   priority: "medium" },
  { id: "area-3", site: "Site B", area: "Floor 2 - Restrooms", reportedAgo: "3 days ago",  priority: "high" },
  { id: "area-4", site: "Site C", area: "Floor 4 - Break Room", reportedAgo: "5 hours ago", priority: "low" },
  { id: "area-5", site: "Site D", area: "Floor 5 - Conference", reportedAgo: "4 days ago",  priority: "high" },
];

let myTasks: MyTaskRecord[] = [
  { id: "task-1", site: "Site A", area: "Floor 3",        taskType: "Inspection",    description: "Quarterly inspection",     status: "in_progress", dueTime: "10:00 AM" },
  { id: "task-2", site: "Site B", area: "Main Entrance",   taskType: "Quality Check", description: "Check cleaning quality",   status: "in_progress", dueTime: "11:30 AM" },
  { id: "task-3", site: "Site C", area: "Floor 2",         taskType: "Inspection",    description: "Weekly inspection round",  status: "pending",     dueTime: "02:00 PM" },
];

const sitePerformance: SitePerformanceRecord[] = [
  { site: "Site A", completion: 96, avgTime: "2.3h", rating: 9.1 },
  { site: "Site B", completion: 98, avgTime: "2.1h", rating: 9.3 },
  { site: "Site C", completion: 94, avgTime: "2.5h", rating: 8.9 },
  { site: "Site D", completion: 97, avgTime: "2.2h", rating: 9.2 },
];

const cleanerRankings: CleanerRankingRecord[] = [
  { rank: 1, cleaner: "Maria Garcia",    site: "Site B", tasksCompleted: 45, avgRating: 9.5, onTimeRate: 100, performance: 95 },
  { rank: 2, cleaner: "James Lee",       site: "Site C", tasksCompleted: 38, avgRating: 8.7, onTimeRate: 90,  performance: 88 },
  { rank: 3, cleaner: "Aisha Khan",      site: "Site A", tasksCompleted: 50, avgRating: 9.2, onTimeRate: 95,  performance: 92 },
  { rank: 4, cleaner: "Liam O'Connor",   site: "Site D", tasksCompleted: 42, avgRating: 7.8, onTimeRate: 85,  performance: 87 },
  { rank: 5, cleaner: "Sofia Martinez",  site: "Site B", tasksCompleted: 48, avgRating: 9.0, onTimeRate: 92,  performance: 90 },
];

export function getAreasNeedingInspection(): AreaInspectionRecord[] {
  return areasNeedingInspection;
}

export function getMyTasks(): MyTaskRecord[] {
  return myTasks;
}

export function getSitePerformance(): SitePerformanceRecord[] {
  return sitePerformance;
}

export function getCleanerRankings(): CleanerRankingRecord[] {
  return cleanerRankings;
}

export function getInspectionKpis() {
  return {
    taskCompletionRate:  96.5,
    avgTaskDurationHours: 2.3,
    customerSatisfaction: 9.1,
    activeCleaners:       45,
  };
}

export function startMyTask(id: string): MyTaskRecord | undefined {
  let updated: MyTaskRecord | undefined;
  myTasks = myTasks.map((task) => {
    if (task.id !== id) return task;
    updated = { ...task, status: "in_progress" };
    return updated;
  });
  return updated;
}

export function completeMyTask(id: string): void {
  myTasks = myTasks.filter((task) => task.id !== id);
}

export function completeAreaInspection(id: string): void {
  areasNeedingInspection = areasNeedingInspection.filter((area) => area.id !== id);
}
