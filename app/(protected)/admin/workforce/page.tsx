"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";
import { useIsDrawerNav } from "@/components/layout/AppNav";
import { PageHeader } from "@/components/shared/PageHeader";
import { WorkforceCalendar, type AssignmentPrefill } from "@/components/admin/WorkforceCalendar";
import { SiteFilterSelect } from "@/components/admin/SiteFilterSelect";
import { NewAssignmentModal } from "@/components/admin/NewAssignmentModal";
import { DraftsModal } from "@/components/admin/DraftsModal";
import { SegmentedTabs } from "@/components/shared/SegmentedTabs";
import { TaskTemplatesTab } from "@/features/workforce/components/TaskTemplatesTab";
import { SiteManagement } from "@/features/user-management/components/SiteManagement";
import { SiteRoster } from "@/features/user-management/components/SiteRoster";
import { CleanerManagement } from "@/features/cleaners/components/CleanerManagement";
import { useMe } from "@/features/auth/hooks/useMe";
import { useSites } from "@/features/user-management/hooks/useSites";
import { useDrafts } from "@/features/workforce/hooks/useDrafts";
import type { AssignmentDraft } from "@/features/workforce/schemas/draft.schema";
import { cn } from "@/lib/utils/cn";

// ── Helpers ─────────────────────────────────────────────────────────────────────

const MANAGER_TABS = ["Operations", "Sites", "Cleaners", "Task Templates"] as const;
type Tab = (typeof MANAGER_TABS)[number];

/** URL-friendly slug per tab, so the selection survives refreshes and can be linked. */
const TAB_SLUG: Record<Tab, string> = {
  Operations: "operations",
  Sites: "sites",
  Cleaners: "cleaners",
  "Task Templates": "templates",
};
const SLUG_TAB: Record<string, Tab> = {
  operations: "Operations",
  sites: "Sites",
  cleaners: "Cleaners",
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
  const tabs: Tab[] = isManager ? [...MANAGER_TABS] : ["Operations"];
  const isSupervisor = me.data?.role === "SUPERVISOR";

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
  const [operationsSiteId, setOperationsSiteId] = useState("");
  useEffect(() => {
    const list = sitesQuery.data;
    if (list && list.length > 0 && !list.some((s) => s.id === operationsSiteId)) {
      setOperationsSiteId(list[0]!.id);
    }
  }, [sitesQuery.data, operationsSiteId]);
  const selectedSite = sitesQuery.data?.find((s) => s.id === operationsSiteId) ?? null;

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
    setPrefill({ date: new Date(), time: "09:00" });
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
                  sites={sitesQuery.data ?? []}
                  value={operationsSiteId}
                  onChange={setOperationsSiteId}
                  loading={sitesQuery.isLoading}
                  variant="field"
                />
                <div className="flex shrink-0 items-center gap-3">
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
          {tab === "Cleaners" && <CleanerManagement />}
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
          defaultTaskName={prefill.taskName}
          loadedDraft={loadedDraft}
        />

        {/* Drafts Modal */}
        <DraftsModal open={draftsOpen} onClose={() => setDraftsOpen(false)} onLoad={handleLoadDraft} />
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
