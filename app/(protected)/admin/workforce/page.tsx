"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { useIsDrawerNav } from "@/components/layout/AppNav";
import { PageHeader } from "@/components/shared/PageHeader";
import { WorkforceCalendar, type AssignmentPrefill } from "@/components/admin/WorkforceCalendar";
import { NewAssignmentModal } from "@/components/admin/NewAssignmentModal";
import { DraftsModal } from "@/components/admin/DraftsModal";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { TaskTemplatesTab } from "@/features/workforce/components/TaskTemplatesTab";
import { useDrafts } from "@/features/workforce/hooks/useDrafts";
import type { AssignmentDraft } from "@/features/workforce/schemas/draft.schema";
import { cn } from "@/lib/utils/cn";

// ── Helpers ─────────────────────────────────────────────────────────────────────

const TABS = ["Operations", "Task Templates"] as const;
type Tab = (typeof TABS)[number];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WorkforcePage() {
  const useDrawerNav = useIsDrawerNav();
  const [tab, setTab] = useState<Tab>("Operations");
  const [newAssignmentOpen, setNewAssignmentOpen] = useState(false);
  const [prefill, setPrefill] = useState<AssignmentPrefill>({});
  const [loadedDraft, setLoadedDraft] = useState<{ id: string; payload: unknown } | null>(null);
  const [draftsOpen, setDraftsOpen] = useState(false);

  const draftsQuery = useDrafts();
  const draftCount = draftsQuery.data?.length ?? 0;

  function handlePrefill(next: AssignmentPrefill) {
    setLoadedDraft(null);
    setPrefill(next);
    setNewAssignmentOpen(true);
  }

  function handleNewAssignmentButton() {
    setLoadedDraft(null);
    setPrefill({ date: new Date(), time: "09:00" });
    setNewAssignmentOpen(true);
  }

  function handleLoadDraft(draft: AssignmentDraft) {
    setPrefill({});
    setLoadedDraft({ id: draft.id, payload: draft.payload });
    setDraftsOpen(false);
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

      <div className={cn("px-6 pt-6 lg:px-8 lg:pt-8", !useDrawerNav ? "pb-28 lg:pb-8" : "pb-6 lg:pb-8")}>
      <div className="mx-auto max-w-7xl">
        {/* Page header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-grey-500">
              {tab === "Operations" ? "Operational view" : "Reusable task lists"}
            </p>
          </div>
          {tab === "Operations" && (
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setDraftsOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-grey-300 px-4 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <FileText size={16} aria-hidden="true" />
                Drafts
                {draftCount > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
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
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <FilterTabs<Tab> options={[...TABS]} value={tab} onChange={setTab} />
        </div>

        {tab === "Task Templates" ? (
          <TaskTemplatesTab />
        ) : (
          <>
        {/* Calendar (scope view) */}
        <WorkforceCalendar onNewAssignment={handlePrefill} />
          </>
        )}
      </div>

      {/* New Assignment Modal */}
      <NewAssignmentModal
        open={newAssignmentOpen}
        onClose={handleAssignmentModalClose}
        defaultDate={prefill.date}
        defaultTime={prefill.time}
        defaultSiteId={prefill.siteId}
        defaultFloorId={prefill.floorId}
        defaultAreaId={prefill.areaId}
        loadedDraft={loadedDraft}
      />

      {/* Drafts Modal */}
      <DraftsModal open={draftsOpen} onClose={() => setDraftsOpen(false)} onLoad={handleLoadDraft} />
    </div>
    </>
  );
}
