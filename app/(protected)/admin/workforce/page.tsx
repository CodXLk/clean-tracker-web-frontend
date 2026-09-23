"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";
import { useIsDrawerNav } from "@/components/layout/AppNav";
import { PageHeader } from "@/components/shared/PageHeader";
import { WorkforceCalendar, type AssignmentPrefill } from "@/components/admin/WorkforceCalendar";
import { SiteFilterSelect } from "@/components/admin/SiteFilterSelect";
import { NewAssignmentModal, type WorkOrderTaskConfig } from "@/components/admin/NewAssignmentModal";
import { DraftsModal } from "@/components/admin/DraftsModal";
import { SegmentedTabs } from "@/components/shared/SegmentedTabs";
import { TaskTemplatesTab } from "@/features/workforce/components/TaskTemplatesTab";
import { WorkOrdersSection } from "@/features/work-orders/components/WorkOrdersSection";
import { SiteManagement } from "@/features/user-management/components/SiteManagement";
import { SiteRoster } from "@/features/user-management/components/SiteRoster";
import { isSelectableInOperations } from "@/features/user-management/schemas/site.schema";
import { CleanerManagement } from "@/features/cleaners/components/CleanerManagement";
import { StaffManagement } from "@/features/users/components/StaffManagement";
import { DocumentReviewModal } from "@/features/users/components/DocumentReviewModal";
import { useMe } from "@/features/auth/hooks/useMe";
import { useSites } from "@/features/user-management/hooks/useSites";
import { useWorkOrders } from "@/features/work-orders/hooks/useWorkOrders";
import type { WorkOrder } from "@/features/work-orders/schemas/workOrder.schema";
import { useDrafts } from "@/features/workforce/hooks/useDrafts";
import type { AssignmentDraft } from "@/features/workforce/schemas/draft.schema";
import { cn } from "@/lib/utils/cn";

// ── Helpers ─────────────────────────────────────────────────────────────────────

const MANAGER_TABS = ["Operations", "Work Orders", "Sites", "Cleaners", "Supervisors", "Task Templates"] as const;
type Tab = (typeof MANAGER_TABS)[number];

/** URL-friendly slug per tab, so the selection survives refreshes and can be linked. */
const TAB_SLUG: Record<Tab, string> = {
  Operations: "operations",
  "Work Orders": "work-orders",
  Sites: "sites",
  Cleaners: "cleaners",
  Supervisors: "supervisors",
  "Task Templates": "templates",
};
const SLUG_TAB: Record<string, Tab> = {
  operations: "Operations",
  "work-orders": "Work Orders",
  sites: "Sites",
  cleaners: "Cleaners",
  supervisors: "Supervisors",
  templates: "Task Templates",
};

// ── Page ──────────────────────────────────────────────────────────────────────

function WorkforceContent() {
  const useDrawerNav = useIsDrawerNav();
  const me = useMe();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Clients/cleaners only get the operational calendar; site, cleaner and
  // template management stay with management roles.
  const isManager = me.data ? me.data.role !== "CLIENT" && me.data.role !== "CLEANER" : false;
  const isSupervisor = me.data?.role === "SUPERVISOR";
  // Supervisors manage day-to-day work but not the Sites or Cleaners rosters.
  const tabs: Tab[] = isManager
    ? MANAGER_TABS.filter((t) => !isSupervisor || (t !== "Sites" && t !== "Cleaners"))
    : ["Operations"];

  // URL is the source of truth; fall back to Operations for unknown/forbidden tabs.
  const requested = SLUG_TAB[searchParams.get("tab") ?? ""] ?? "Operations";
  const tab: Tab = tabs.includes(requested) ? requested : "Operations";

  function setTab(next: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", TAB_SLUG[next]);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  // Operations shares one selected site between the header picker and the calendar.
  const sitesQuery = useSites();
  // Completed one-time work-order sites are hidden from the Operations picker.
  const operationsSites = useMemo(
    () => (sitesQuery.data ?? []).filter(isSelectableInOperations),
    [sitesQuery.data],
  );
  const [operationsSiteId, setOperationsSiteId] = useState("");
  useEffect(() => {
    if (operationsSites.length > 0 && !operationsSites.some((s) => s.id === operationsSiteId)) {
      setOperationsSiteId(operationsSites[0]!.id);
    }
  }, [operationsSites, operationsSiteId]);
  const selectedSite = operationsSites.find((s) => s.id === operationsSiteId) ?? null;

  // Work orders let one-time sites lock task-adding to WORK_ORDER and show their PO id in the picker.
  const workOrdersQuery = useWorkOrders();
  const workOrderBySiteId = useMemo(() => {
    const map = new Map<string, WorkOrder>();
    for (const wo of workOrdersQuery.data ?? []) {
      if (wo.siteId && wo.status !== "COMPLETED") map.set(wo.siteId, wo);
    }
    return map;
  }, [workOrdersQuery.data]);

  // Show one-time work-order sites as "Site name · <poId>" so same-named sites stay distinguishable.
  // Legacy sites named after the PO id (or with no real name) fall back to just the PO id.
  const siteFilterOptions = useMemo(
    () =>
      operationsSites.map((s) => {
        const wo = s.oneTimeSite ? workOrderBySiteId.get(s.id) : undefined;
        if (!wo) return { id: s.id, name: s.name };
        const siteName = s.name?.trim();
        const hasRealName = siteName && siteName !== wo.poId;
        return { id: s.id, name: hasRealName ? `${siteName} · ${wo.poId}` : wo.poId };
      }),
    [operationsSites, workOrderBySiteId],
  );

  // A one-time work-order site's locked WORK_ORDER config for the assignment modal (else undefined).
  function workOrderModeForSite(siteId: string | undefined): WorkOrderTaskConfig | undefined {
    if (!siteId) return undefined;
    const site = operationsSites.find((s) => s.id === siteId);
    if (!site?.oneTimeSite) return undefined;
    const wo = workOrderBySiteId.get(siteId);
    if (!wo) return undefined;
    return {
      workOrderId: wo.id,
      poId: wo.poId,
      siteId: wo.siteId ?? siteId,
      startDate: wo.startDate ?? undefined,
      startTime: wo.startTime ? wo.startTime.slice(0, 5) : undefined,
      cleanerProfiles: wo.cleanerProfiles.map((p) => ({
        id: p.id,
        label: p.label,
        cleanerName: p.cleanerName,
      })),
      supervisorProfileIds: wo.supervisorProfiles.map((p) => p.id),
    };
  }

  const [newAssignmentOpen, setNewAssignmentOpen] = useState(false);
  const [prefill, setPrefill] = useState<AssignmentPrefill>({});
  const [loadedDraft, setLoadedDraft] = useState<{ id: string; payload: unknown } | null>(null);
  const [draftsOpen, setDraftsOpen] = useState(false);
  // Bumped on every open so the modal remounts with a fresh, empty form (no leftover tasks).
  const [assignmentModalKey, setAssignmentModalKey] = useState(0);

  const draftsQuery = useDrafts();
  const draftCount = draftsQuery.data?.length ?? 0;

  function handlePrefill(next: AssignmentPrefill) {
    setLoadedDraft(null);
    setPrefill(next);
    setAssignmentModalKey((k) => k + 1);
    setNewAssignmentOpen(true);
  }

  function handleNewAssignmentButton() {
    setLoadedDraft(null);
    // For a one-time work-order site, seed the work order's start date so the task lands on it.
    const woStart = workOrderBySiteId.get(operationsSiteId)?.startDate;
    // Default to the site's start date when it's still in the future, so we don't seed a date
    // before the site begins operating.
    const start = woStart
      ? new Date(`${woStart}T00:00:00`)
      : selectedSite?.startDate
        ? new Date(`${selectedSite.startDate}T00:00:00`)
        : null;
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const date =
      woStart && start && !Number.isNaN(start.getTime())
        ? start
        : start && !Number.isNaN(start.getTime()) && start.getTime() > todayMidnight.getTime()
          ? start
          : new Date();
    // Seed the modal with the site currently selected in Operations.
    setPrefill({ date, time: "09:00", siteId: operationsSiteId || undefined });
    setAssignmentModalKey((k) => k + 1);
    setNewAssignmentOpen(true);
  }

  function handleLoadDraft(draft: AssignmentDraft) {
    setPrefill({});
    setLoadedDraft({ id: draft.id, payload: draft.payload });
    setDraftsOpen(false);
    setAssignmentModalKey((k) => k + 1);
    setNewAssignmentOpen(true);
  }

  function handleAssignmentModalClose() {
    setNewAssignmentOpen(false);
    setLoadedDraft(null);
  }

  // Notification deep-link: ?docUser=<userId> opens that person's compliance documents to verify.
  const docUserId = searchParams.get("docUser");
  function closeDocReview() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("docUser");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <>
      {!useDrawerNav && (
        <div className="lg:hidden">
          <PageHeader title="Workforce" />
        </div>
      )}

      <div className={cn("px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8", !useDrawerNav ? "pb-28 lg:pb-8" : "pb-6 lg:pb-8")}>
        <div className="mx-auto max-w-7xl">
          {/* Table-header style section switcher */}
          <div className="mb-6">
            <SegmentedTabs<Tab> options={tabs} value={tab} onChange={setTab} />
          </div>

          {tab === "Operations" && (
            <>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <SiteFilterSelect
                  sites={siteFilterOptions}
                  value={operationsSiteId}
                  onChange={setOperationsSiteId}
                  loading={sitesQuery.isLoading}
                  variant="field"
                />
                <div className="flex shrink-0 items-center gap-3">
                  {draftCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setDraftsOpen(true)}
                    className="flex items-center gap-2 rounded-xl border border-grey-300 px-4 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <FileText size={16} aria-hidden="true" />
                    Drafts
                    {draftCount > 0 && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-ink">
                        {draftCount}
                      </span>
                    )}
                  </button>
                  )}
                  <button
                    type="button"
                    onClick={handleNewAssignmentButton}
                    className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    + New Assignment
                  </button>
                </div>
              </div>

              {isManager && (
                <SiteRoster
                  key={selectedSite?.id ?? "none"}
                  site={selectedSite}
                  canManageSupervisors={!isSupervisor}
                  restrictCleanerSlots={isSupervisor}
                />
              )}

              <WorkforceCalendar
                onNewAssignment={handlePrefill}
                siteId={operationsSiteId}
                onSiteChange={setOperationsSiteId}
              />
            </>
          )}

          {tab === "Sites" && <SiteManagement />}
          {tab === "Work Orders" && <WorkOrdersSection />}
          {tab === "Cleaners" && <CleanerManagement />}
          {tab === "Supervisors" && <StaffManagement role="SUPERVISOR" noun="supervisor" />}
          {tab === "Task Templates" && <TaskTemplatesTab />}
        </div>

        {/* New Assignment Modal */}
        <NewAssignmentModal
          key={assignmentModalKey}
          open={newAssignmentOpen}
          onClose={handleAssignmentModalClose}
          defaultDate={prefill.date}
          defaultTime={prefill.time}
          defaultSiteId={prefill.siteId}
          defaultFloorId={prefill.floorId}
          defaultAreaId={prefill.areaId}
          defaultAreaIds={prefill.areaIds}
          defaultAreaGroupId={prefill.areaGroupId}
          defaultTaskName={prefill.taskName}
          scopeMode={prefill.mode}
          scopeWeekday={prefill.weekday}
          sourceTask={prefill.sourceTask}
          workOrderMode={workOrderModeForSite(prefill.siteId ?? operationsSiteId)}
          loadedDraft={loadedDraft}
        />

        {/* Drafts Modal */}
        <DraftsModal open={draftsOpen} onClose={() => setDraftsOpen(false)} onLoad={handleLoadDraft} />

        {/* Notification deep-link: review a person's compliance documents. */}
        <DocumentReviewModal userId={docUserId} onClose={closeDocReview} />
      </div>
    </>
  );
}

export default function WorkforcePage() {
  return (
    <Suspense fallback={null}>
      <WorkforceContent />
    </Suspense>
  );
}
