"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Plus, X, CalendarCheck, Building2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useSites, useClientPortalSites } from "@/features/user-management/hooks/useSites";
import { useMe } from "@/features/auth/hooks/useMe";
import { useFloors } from "@/features/user-management/hooks/useFloors";
import { useAreas } from "@/features/user-management/hooks/useAreas";
import { useOccurrences, useDeleteAssignment } from "@/features/workforce/hooks/useAssignments";
import {
  useSiteCleaningTemplates,
  useCleaningCheckIn,
} from "@/features/user-management/hooks/useCleaningSchedule";
import { WORK_TYPE_LABELS, type TaskOccurrence } from "@/features/workforce/schemas/assignment.schema";
import type { Area } from "@/features/user-management/schemas/area.schema";
import { ConfirmDialog } from "@/features/user-management/components/ConfirmDialog";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";

// ── Date helpers ────────────────────────────────────────────────────────────────

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - dow);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** e.g. "3 Mar – 9 Mar 2026". */
function weekRangeLabel(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const s = start.toLocaleDateString(undefined, opts);
  const e = end.toLocaleDateString(undefined, { ...opts, year: "numeric" });
  return `${s} – ${e}`;
}

// ── Colours (match the scope view) ──────────────────────────────────────────────

const TYPE_HEX: Record<string, string> = {
  GENERAL_TASK: "#0B585A",
  PERIODICAL_TASK: "#A855F7",
  WORK_ORDER: "#F97316",
  OTHER: "#3B82F6",
};

function occurrenceHex(o: TaskOccurrence): string {
  return o.colorHex ?? TYPE_HEX[o.assignmentType] ?? "#0B585A";
}

// ── Grouping: one entry per template (assignment) added to an area on a day ───────

interface DayTemplate {
  assignmentId: string;
  templateName: string;
  hex: string;
}

/** areaId → date → the distinct templates checked in that day (deduped by assignment). */
function templatesByAreaDate(
  occurrences: TaskOccurrence[],
): Map<string, Map<string, DayTemplate[]>> {
  const byArea = new Map<string, Map<string, Map<string, DayTemplate>>>();
  for (const o of occurrences) {
    const byDate = byArea.get(o.areaId) ?? new Map<string, Map<string, DayTemplate>>();
    byArea.set(o.areaId, byDate);
    const byAssignment = byDate.get(o.date) ?? new Map<string, DayTemplate>();
    byDate.set(o.date, byAssignment);
    if (!byAssignment.has(o.assignmentId)) {
      byAssignment.set(o.assignmentId, {
        assignmentId: o.assignmentId,
        templateName: o.templateName?.trim() || WORK_TYPE_LABELS[o.assignmentType],
        hex: occurrenceHex(o),
      });
    }
  }
  const result = new Map<string, Map<string, DayTemplate[]>>();
  for (const [areaId, byDate] of byArea) {
    const dateMap = new Map<string, DayTemplate[]>();
    for (const [date, byAssignment] of byDate) {
      dateMap.set(
        date,
        [...byAssignment.values()].sort((a, b) => a.templateName.localeCompare(b.templateName)),
      );
    }
    result.set(areaId, dateMap);
  }
  return result;
}


const GRID_TEMPLATE = "minmax(220px, 1.6fr) repeat(7, minmax(72px, 1fr))";
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Page ────────────────────────────────────────────────────────────────────────

export default function ClientSiteManagementPage() {
  const me = useMe();
  const isClient = me.data?.role === "CLIENT";
  // Clients see only their own flag-enabled sites; management sees all sites.
  const allSitesQuery = useSites({ enabled: !isClient });
  const portalQuery = useClientPortalSites(isClient);
  const sites = (isClient ? portalQuery.data : allSitesQuery.data) ?? [];

  const [siteId, setSiteId] = useState<string>("");
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));

  // Default to the most recently created site (sites are returned newest-first); never "all sites".
  if (sites.length > 0 && !sites.some((s) => s.id === siteId)) {
    setSiteId(sites[0]!.id);
  }

  const selectedSite = useMemo(() => sites.find((s) => s.id === siteId), [sites, siteId]);
  const isHotel = selectedSite?.siteType === "HOTEL";

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const weekISO = useMemo(() => weekDays.map(toISODate), [weekDays]);
  const from = weekISO[0];
  const to = weekISO[6];
  const todayISO = toISODate(new Date());

  const occurrencesQuery = useOccurrences(siteId ? { from, to, siteId } : undefined);
  const floorsQuery = useFloors(siteId || undefined);
  const areasQuery = useAreas(undefined, { enabled: !!siteId });
  const templatesQuery = useSiteCleaningTemplates(isHotel ? siteId : undefined);
  const checkIn = useCleaningCheckIn();
  const deleteAssignment = useDeleteAssignment();

  const [openCell, setOpenCell] = useState<{ floorId: string; areaId: string; date: string } | null>(
    null,
  );
  const [banner, setBanner] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [pendingRemove, setPendingRemove] = useState<{
    assignmentId: string;
    templateName: string;
    dayIso: string;
  } | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const floors = useMemo(
    () => (floorsQuery.data ?? []).slice().sort((a, b) => a.name.localeCompare(b.name)),
    [floorsQuery.data],
  );
  const areasByFloor = useMemo(() => {
    const map = new Map<string, Area[]>();
    for (const floor of floors) map.set(floor.id, []);
    for (const area of areasQuery.data ?? []) {
      if (map.has(area.floorId)) map.get(area.floorId)!.push(area);
    }
    for (const list of map.values()) list.sort((a, b) => a.name.localeCompare(b.name));
    return map;
  }, [floors, areasQuery.data]);

  const areaTemplates = useMemo(
    () => templatesByAreaDate(occurrencesQuery.data ?? []),
    [occurrencesQuery.data],
  );

  const templates = templatesQuery.data ?? [];
  const structureLoading = floorsQuery.isLoading || areasQuery.isLoading;

  async function addTemplate(floorId: string, areaId: string, dayIso: string, templateId: string) {
    if (!siteId || !templateId) return;
    try {
      await checkIn.mutateAsync({
        siteId,
        date: dayIso,
        siteCleaningTemplateId: templateId,
        floorId,
        areaId,
      });
      const tpl = templates.find((t) => t.id === templateId);
      setBanner({
        kind: "success",
        text: `${tpl?.templateName ?? "Template"} added on ${dayIso}. Cleaners have been notified.`,
      });
      setOpenCell(null);
    } catch (err) {
      setBanner({ kind: "error", text: getErrorMessage(err) });
    }
  }

  async function removeTemplate() {
    if (!pendingRemove) return;
    const { assignmentId, templateName, dayIso } = pendingRemove;
    setRemoveError(null);
    try {
      await deleteAssignment.mutateAsync(assignmentId);
      setBanner({ kind: "success", text: `${templateName} removed from ${dayIso}.` });
      setPendingRemove(null);
    } catch (err) {
      setRemoveError(getErrorMessage(err));
    }
  }

  const weekRange = weekRangeLabel(weekDays[0], weekDays[6]);
  const taskCount = occurrencesQuery.data?.length ?? 0;

  // Empty day-cell strip to complete a floor band row.
  const bandCells = () =>
    weekISO.map((iso) => <div key={iso} className="border-l border-white/15" />);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <p className="text-sm text-grey-500">
        View a site&apos;s cleaning schedule by floor and area. For hotels, hover an area and pick a
        saved template on any day to schedule its tasks and notify the responsible cleaners. Click a
        template to remove it if it was added by mistake.
      </p>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-grey-200 bg-surface p-4 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        {/* Site filter */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="site" className="text-xs font-semibold uppercase tracking-wide text-grey-500">
            Site
          </label>
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grey-400" aria-hidden="true" />
            <select
              id="site"
              value={siteId}
              onChange={(e) => {
                setSiteId(e.target.value);
                setOpenCell(null);
                setBanner(null);
              }}
              className="h-11 w-full min-w-[16rem] appearance-none rounded-xl border border-grey-300 bg-surface pl-9 pr-9 text-sm font-medium text-on-surface transition-colors hover:border-grey-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.siteType === "HOTEL" ? " (Hotel)" : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grey-400" aria-hidden="true" />
          </div>
        </div>

        {/* Week navigator */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-grey-500">Week</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl border border-grey-300 bg-surface p-1">
              <button
                type="button"
                aria-label="Previous week"
                onClick={() => setWeekStart((w) => addDays(w, -7))}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface transition-colors hover:bg-grey-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[10rem] px-2 text-center text-sm font-semibold text-on-surface">
                {weekRange}
              </span>
              <button
                type="button"
                aria-label="Next week"
                onClick={() => setWeekStart((w) => addDays(w, 7))}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface transition-colors hover:bg-grey-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setWeekStart(startOfWeek(new Date()))}
              className="h-10 rounded-xl border border-grey-300 px-4 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100"
            >
              This week
            </button>
          </div>
        </div>
      </div>

      {banner && (
        <p
          role="status"
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-medium",
            banner.kind === "success" ? "bg-success/10 text-success" : "bg-error/10 text-error",
          )}
        >
          {banner.text}
        </p>
      )}

      {!siteId ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-grey-300 bg-grey-50 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-on-surface">Select a site to begin</p>
          <p className="max-w-sm text-xs text-grey-500">
            Choose a site above to view its weekly cleaning schedule by floor and area.
          </p>
        </div>
      ) : (
        <>
          {selectedSite && !isHotel && (
            <p className="rounded-lg bg-grey-100 px-3 py-2 text-xs text-grey-600">
              This site is not a hotel — the schedule is read-only. Hotel sites support daily
              check-ins.
            </p>
          )}
          {isHotel && templates.length === 0 && !templatesQuery.isLoading && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              No cleaning templates are configured for this site yet. Add them in the site&apos;s edit
              form (Site Management).
            </p>
          )}

          {/* Scope-style grid: floors/areas as rows, days as columns */}
          <div className="rounded-2xl border border-grey-200 bg-surface shadow-sm">
            <div className="flex flex-wrap items-center gap-2 border-b border-grey-200 px-4 py-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-grey-100 px-2.5 py-1 text-xs font-medium text-grey-600">
                <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {occurrencesQuery.isLoading
                  ? "Loading…"
                  : `${taskCount} task${taskCount === 1 ? "" : "s"} this week`}
              </span>
              <div className="ml-auto flex flex-wrap items-center gap-3">
                {(Object.keys(WORK_TYPE_LABELS) as Array<keyof typeof WORK_TYPE_LABELS>).map(
                  (type) => (
                    <span key={type} className="flex items-center gap-1.5 text-xs text-grey-500">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-sm"
                        style={{ backgroundColor: TYPE_HEX[type] }}
                        aria-hidden="true"
                      />
                      {WORK_TYPE_LABELS[type]}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                {/* Day header row */}
                <div
                  className="sticky top-0 z-10 grid border-b-2 border-grey-300 bg-surface"
                  style={{ gridTemplateColumns: GRID_TEMPLATE }}
                >
                  <div className="flex items-end px-4 pb-2 pt-3 text-xs font-bold uppercase tracking-wide text-grey-500">
                    Floor / Area
                  </div>
                  {weekDays.map((day, i) => {
                    const iso = weekISO[i];
                    const isToday = iso === todayISO;
                    const isWeekend = i >= 5;
                    return (
                      <div
                        key={iso}
                        className={cn(
                          "flex flex-col items-center gap-1 border-l border-grey-200 py-2.5",
                          isToday ? "bg-primary/5" : isWeekend && "bg-grey-50",
                        )}
                      >
                        <span
                          className={cn(
                            "text-[11px] font-bold uppercase tracking-wide",
                            isToday ? "text-primary" : isWeekend ? "text-grey-400" : "text-grey-600",
                          )}
                        >
                          {DAY_LABELS[i]}
                        </span>
                        <span
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                            isToday ? "bg-primary text-white shadow-sm" : "text-on-surface",
                          )}
                        >
                          {day.getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Body */}
                {structureLoading ? (
                  <p className="px-4 py-10 text-center text-sm text-grey-500">Loading structure…</p>
                ) : floors.length === 0 ? (
                  <p className="px-4 py-10 text-center text-sm text-grey-500">
                    This site has no floors or areas configured yet.
                  </p>
                ) : (
                  floors.map((floor) => {
                    const floorAreas = areasByFloor.get(floor.id) ?? [];
                    return (
                      <div key={floor.id}>
                        {/* Floor band */}
                        <div className="grid bg-primary" style={{ gridTemplateColumns: GRID_TEMPLATE }}>
                          <div className="px-4 py-2 text-sm font-bold uppercase tracking-wide text-white">
                            {floor.name}
                          </div>
                          {bandCells()}
                        </div>

                        {floorAreas.length === 0 ? (
                          <div
                            className="grid border-b border-grey-200 bg-grey-100/40"
                            style={{ gridTemplateColumns: GRID_TEMPLATE }}
                          >
                            <div className="px-6 py-2 text-xs italic text-grey-500">
                              No areas configured.
                            </div>
                            {weekISO.map((iso) => (
                              <div key={iso} className="border-l border-grey-200/60" />
                            ))}
                          </div>
                        ) : (
                          floorAreas.map((area) => {
                            const dayTemplates = areaTemplates.get(area.id);
                            return (
                              <div key={area.id}>
                                {/* Area band — each day cell lists the templates added that
                                    day (click a chip to remove) and a button to add one. */}
                                <div
                                  className="group/area grid border-b border-grey-200 bg-primary/10"
                                  style={{ gridTemplateColumns: GRID_TEMPLATE }}
                                >
                                  <div className="flex items-center px-4 py-1.5 text-[13px] font-semibold text-primary">
                                    {area.name}
                                  </div>
                                  {weekISO.map((iso) => {
                                    const isOpen =
                                      openCell?.areaId === area.id && openCell?.date === iso;
                                    const added = dayTemplates?.get(iso) ?? [];
                                    const isToday = iso === todayISO;
                                    return (
                                      <div
                                        key={iso}
                                        className={cn(
                                          "flex flex-col items-stretch justify-center gap-1 border-l border-grey-200/60 px-1.5 py-1.5",
                                          isToday && "bg-primary/[0.04]",
                                        )}
                                      >
                                        {added.map((tpl) => (
                                          <button
                                            key={tpl.assignmentId}
                                            type="button"
                                            disabled={deleteAssignment.isPending}
                                            onClick={() => {
                                              setBanner(null);
                                              setRemoveError(null);
                                              setPendingRemove({
                                                assignmentId: tpl.assignmentId,
                                                templateName: tpl.templateName,
                                                dayIso: iso,
                                              });
                                            }}
                                            title={`${tpl.templateName} — click to remove`}
                                            className="group/chip flex items-center justify-center gap-1 rounded-lg border px-2 py-1 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                            style={{
                                              borderColor: `${tpl.hex}55`,
                                              backgroundColor: `${tpl.hex}12`,
                                            }}
                                          >
                                            <span
                                              className="truncate text-[11px] font-semibold"
                                              style={{ color: tpl.hex }}
                                            >
                                              {tpl.templateName}
                                            </span>
                                            <X
                                              size={11}
                                              aria-hidden="true"
                                              className="shrink-0 opacity-0 transition-opacity group-hover/chip:opacity-100"
                                              style={{ color: tpl.hex }}
                                            />
                                          </button>
                                        ))}

                                        {isHotel &&
                                          (isOpen ? (
                                            <select
                                              autoFocus
                                              defaultValue=""
                                              disabled={checkIn.isPending}
                                              onChange={(e) =>
                                                e.target.value &&
                                                addTemplate(floor.id, area.id, iso, e.target.value)
                                              }
                                              onBlur={() => setOpenCell(null)}
                                              className="w-full rounded-md border border-teal-400 bg-surface px-1 py-0.5 text-[11px] text-on-surface focus:outline-none"
                                            >
                                              <option value="" disabled>
                                                Template…
                                              </option>
                                              {templates.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                  {t.templateName ?? "Template"}
                                                </option>
                                              ))}
                                            </select>
                                          ) : (
                                            <button
                                              type="button"
                                              aria-label={`Add a template in ${area.name} on ${iso}`}
                                              title="Add a saved template"
                                              disabled={templates.length === 0}
                                              onClick={() => {
                                                setBanner(null);
                                                setOpenCell({
                                                  floorId: floor.id,
                                                  areaId: area.id,
                                                  date: iso,
                                                });
                                              }}
                                              className={cn(
                                                "mx-auto flex h-5 w-5 items-center justify-center rounded-md text-primary transition-all hover:bg-primary hover:text-white hover:!opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-0",
                                                added.length > 0
                                                  ? "opacity-40 group-hover/area:opacity-70"
                                                  : "opacity-0 group-hover/area:opacity-70",
                                              )}
                                            >
                                              <Plus size={12} aria-hidden="true" />
                                            </button>
                                          ))}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!pendingRemove}
        title="Remove template"
        description={
          pendingRemove
            ? `Remove "${pendingRemove.templateName}" from ${pendingRemove.dayIso}? Its tasks will be unscheduled for that day.`
            : ""
        }
        confirmLabel="Remove"
        isPending={deleteAssignment.isPending}
        error={removeError ?? undefined}
        onConfirm={removeTemplate}
        onClose={() => {
          if (deleteAssignment.isPending) return;
          setPendingRemove(null);
          setRemoveError(null);
        }}
      />
    </div>
  );
}
