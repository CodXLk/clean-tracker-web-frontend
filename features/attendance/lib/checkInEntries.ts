import type { CleanerSite } from "@/features/attendance/schemas/attendance.schema";

/**
 * One check-in "site" per context: the site's own general cleaning, and each work order as its
 * own PO site (even when it runs at a general site).
 */
export interface CheckInEntry extends CleanerSite {
  entryKey: string;
  /** Null for the general site; the work order id for a PO site. */
  contextWorkOrderId: string | null;
  contextPoId: string | null;
}

const OPEN = new Set(["CHECKED_IN", "PAUSED"]);

/** Session fields cleared on entries whose context isn't the one the latest session was for. */
const NO_SESSION = {
  status: null,
  checkInAt: null,
  checkOutAt: null,
  pausedAt: null,
  awayDistanceMeters: null,
  sessionType: null,
  workOrderId: null,
  poId: null,
  pausedMinutes: 0,
} satisfies Partial<CleanerSite>;

export function checkInEntries(sites: CleanerSite[]): CheckInEntry[] {
  const out: CheckInEntry[] = [];
  for (const s of sites) {
    const sessionWo = s.workOrderId ?? null;
    let claimed = false;
    if (s.generalMember && !s.workOrderSite) {
      const mine = sessionWo === null;
      claimed ||= mine;
      out.push({
        ...s,
        ...(mine ? {} : NO_SESSION),
        workOrders: [],
        entryKey: s.siteId,
        contextWorkOrderId: null,
        contextPoId: null,
      });
    }
    for (const w of s.workOrders) {
      const mine = sessionWo === w.id;
      claimed ||= mine;
      out.push({
        ...s,
        ...(mine ? {} : NO_SESSION),
        siteName: `PO ${w.poId} · ${s.siteName}`,
        workOrderSite: true,
        workOrders: [w],
        generalCheckInAllowed: false,
        checkInAllowed: w.checkInAllowed,
        shift: null,
        shifts: [],
        entryKey: `${s.siteId}:${w.id}`,
        contextWorkOrderId: w.id,
        contextPoId: w.poId,
      });
    }
    // An open session whose context has no entry any more (e.g. its work order just closed) stays
    // visible so the user can still check out of it.
    if (!claimed && s.status && OPEN.has(s.status)) {
      out.push({
        ...s,
        siteName: s.poId ? `PO ${s.poId} · ${s.siteName}` : s.siteName,
        workOrders: [],
        entryKey: `${s.siteId}:session`,
        contextWorkOrderId: sessionWo,
        contextPoId: s.poId ?? null,
      });
    }
  }
  return out;
}

/** The context of the user's checked-in (or paused) session: which site and which PO (null = general). */
export interface SessionContext {
  siteId: string;
  poId: string | null;
  workOrderSite: boolean;
}

export function sessionContextOf(sites: CleanerSite[]): SessionContext | null {
  const s = sites.find((x) => x.status === "CHECKED_IN") ?? sites.find((x) => x.status === "PAUSED");
  if (!s) return null;
  return { siteId: s.siteId, poId: s.poId ?? null, workOrderSite: !!s.workOrderSite };
}

/** Whether a task belongs to the session's context: its PO's tasks, or the general (non-work-order) tasks. */
export function inSessionContext(
  task: { siteId?: string | null; assignmentType?: string | null; poId?: string | null },
  ctx: SessionContext | null,
): boolean {
  if (!ctx || task.siteId !== ctx.siteId) return true;
  if (ctx.poId) return task.assignmentType === "WORK_ORDER" && task.poId === ctx.poId;
  // Older sessions at a work-order-only site carry no PO; keep showing that site's tasks.
  if (ctx.workOrderSite) return true;
  return task.assignmentType !== "WORK_ORDER";
}
