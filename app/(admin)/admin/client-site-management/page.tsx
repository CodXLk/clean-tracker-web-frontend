"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useSites } from "@/features/user-management/hooks/useSites";
import { useFloors } from "@/features/user-management/hooks/useFloors";
import { useAreas } from "@/features/user-management/hooks/useAreas";
import { useOccurrences } from "@/features/workforce/hooks/useAssignments";
import {
  useSiteCleaningTemplates,
  useCleaningCheckIn,
} from "@/features/user-management/hooks/useCleaningSchedule";
import { WORK_TYPE_LABELS, type TaskOccurrence } from "@/features/workforce/schemas/assignment.schema";
import type { Area } from "@/features/user-management/schemas/area.schema";
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

// ── Row model (occurrences grouped by area → task → date) ────────────────────────

interface TaskRow {
  taskId: string;
  name: string;
  hex: string;
  byDate: Map<string, TaskOccurrence[]>;
}

function rowsByArea(occurrences: TaskOccurrence[]): Map<string, TaskRow[]> {
  const byArea = new Map<string, Map<string, TaskRow>>();
  for (const o of occurrences) {
    const tasks = byArea.get(o.areaId) ?? new Map<string, TaskRow>();
    byArea.set(o.areaId, tasks);
    const row =
      tasks.get(o.taskId) ??
      { taskId: o.taskId, name: o.name, hex: occurrenceHex(o), byDate: new Map() };
    const list = row.byDate.get(o.date) ?? [];
    list.push(o);
    row.byDate.set(o.date, list);
    tasks.set(o.taskId, row);
  }
  const result = new Map<string, TaskRow[]>();
  for (const [areaId, tasks] of byArea) {
    result.set(areaId, [...tasks.values()].sort((a, b) => a.name.localeCompare(b.name)));
  }
  return result;
}

const GRID_TEMPLATE = "minmax(220px, 1.6fr) repeat(7, minmax(72px, 1fr))";
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Page ────────────────────────────────────────────────────────────────────────

export default function ClientSiteManagementPage() {
  const sitesQuery = useSites();
  const sites = sitesQuery.data ?? [];

  const [siteId, setSiteId] = useState<string>("");
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));

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

  const [openCell, setOpenCell] = useState<{ floorId: string; areaId: string; date: string } | null>(
    null,
  );
  const [banner, setBanner] = useState<{ kind: "success" | "error"; text: string } | null>(null);

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

  const areaRows = useMemo(() => rowsByArea(occurrencesQuery.data ?? []), [occurrencesQuery.data]);

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

  const monthLabel = weekDays[0].toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const taskCount = occurrencesQuery.data?.length ?? 0;

  // Empty day-cell strip to complete a floor band row.
  const bandCells = () =>
    weekISO.map((iso) => <div key={iso} className="border-l border-white/15" />);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-on-surface">
          <CalendarCheck className="h-6 w-6 text-[#ED5F25]" />
          Client Site Management
        </h1>
        <p className="text-sm text-grey-500">
          View a site&apos;s cleaning schedule by floor and area. For hotels, hover an area and pick a
          saved template on any day to schedule its tasks and notify the responsible cleaners.
        </p>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-grey-200 bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="site" className="text-xs font-medium text-grey-500">
            Site
          </label>
          <select
            id="site"
            value={siteId}
            onChange={(e) => {
              setSiteId(e.target.value);
              setOpenCell(null);
              setBanner(null);
            }}
            className="h-10 min-w-64 rounded-lg border border-grey-300 bg-surface px-3 text-sm text-on-surface focus:border-teal-500 focus:outline-none"
          >
            <option value="">Select a site…</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.siteType === "HOTEL" ? " (Hotel)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="mr-2 text-sm font-medium text-on-surface">{monthLabel}</span>
          <button
            type="button"
            aria-label="Previous week"
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-grey-300 text-on-surface hover:bg-grey-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="h-9 rounded-lg border border-grey-300 px-3 text-sm font-semibold text-on-surface hover:bg-grey-100"
          >
            Today
          </button>
          <button
            type="button"
            aria-label="Next week"
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-grey-300 text-on-surface hover:bg-grey-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
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
        <div className="rounded-2xl border border-dashed border-grey-300 p-10 text-center text-sm text-grey-500">
          Select a site to view its cleaning schedule.
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
              form (Client Management → Site Management).
            </p>
          )}

          {/* Scope-style grid: floors/areas as rows, days as columns */}
          <div className="rounded-2xl border border-grey-200 bg-surface">
            <div className="flex items-center gap-2 border-b border-grey-200 px-4 py-2.5">
              <span className="text-xs text-grey-500">
                {occurrencesQuery.isLoading
                  ? "Loading…"
                  : `${taskCount} task${taskCount === 1 ? "" : "s"} scheduled this week`}
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
                    Floor / Area / Task
                  </div>
                  {weekDays.map((day, i) => {
                    const iso = weekISO[i];
                    const isToday = iso === todayISO;
                    return (
                      <div
                        key={iso}
                        className={cn(
                          "flex flex-col items-center gap-1 border-l border-grey-200 py-2",
                          isToday && "bg-primary/5",
                        )}
                      >
                        <span
                          className={cn(
                            "text-xs font-bold uppercase tracking-wide",
                            isToday ? "text-primary" : "text-grey-700",
                          )}
                        >
                          {DAY_LABELS[i]}
                        </span>
                        <span
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                            isToday ? "bg-primary text-white" : "text-on-surface",
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
                            const rows = areaRows.get(area.id) ?? [];
                            return (
                              <div key={area.id}>
                                {/* Area band — hover a day cell to add a saved template */}
                                <div
                                  className="group/area grid border-b border-grey-200 bg-primary/10"
                                  style={{ gridTemplateColumns: GRID_TEMPLATE }}
                                >
                                  <div className="px-4 py-1.5 text-[13px] font-semibold text-primary">
                                    {area.name}
                                  </div>
                                  {weekISO.map((iso) => {
                                    const isOpen =
                                      openCell?.areaId === area.id && openCell?.date === iso;
                                    return (
                                      <div
                                        key={iso}
                                        className="flex items-center justify-center border-l border-grey-200/60 px-1 py-1"
                                      >
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
                                              className="flex h-5 w-5 items-center justify-center rounded-md text-primary opacity-0 transition-all hover:bg-primary hover:text-white group-hover/area:opacity-70 hover:!opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-0"
                                            >
                                              <Plus size={12} aria-hidden="true" />
                                            </button>
                                          ))}
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Task rows */}
                                {rows.length === 0 ? (
                                  <div
                                    className="grid border-b border-grey-200"
                                    style={{ gridTemplateColumns: GRID_TEMPLATE }}
                                  >
                                    <div className="px-6 py-2 text-xs text-grey-300">
                                      No tasks scheduled
                                    </div>
                                    {weekISO.map((iso) => (
                                      <div
                                        key={iso}
                                        className="flex items-center justify-center border-l border-grey-200 py-2 text-xs text-grey-300"
                                      >
                                        —
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  rows.map((row, ri) => (
                                    <div
                                      key={row.taskId}
                                      className={cn(
                                        "grid border-b border-grey-200 transition-colors hover:bg-primary/[0.04]",
                                        ri % 2 === 1 && "bg-grey-100/40",
                                      )}
                                      style={{ gridTemplateColumns: GRID_TEMPLATE }}
                                    >
                                      <div className="flex min-w-0 items-center gap-2.5 px-4 py-2.5 pl-6">
                                        <span
                                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                                          style={{ backgroundColor: row.hex }}
                                          aria-hidden="true"
                                        />
                                        <span
                                          className="truncate text-sm text-on-surface"
                                          title={row.name}
                                        >
                                          {row.name}
                                        </span>
                                      </div>
                                      {weekISO.map((iso) => {
                                        const cell = row.byDate.get(iso) ?? [];
                                        const first = cell[0];
                                        const isToday = iso === todayISO;
                                        return (
                                          <div
                                            key={iso}
                                            className={cn(
                                              "border-l border-grey-200 p-1.5",
                                              isToday && "bg-primary/[0.04]",
                                            )}
                                          >
                                            {first && (
                                              <div
                                                title={`${
                                                  first.templateName?.trim() ||
                                                  WORK_TYPE_LABELS[first.assignmentType]
                                                } · ${first.startTime.slice(0, 5)}–${first.endTime.slice(0, 5)}`}
                                                className="rounded-lg border px-2 py-1 text-center"
                                                style={{
                                                  borderColor: `${occurrenceHex(first)}55`,
                                                  backgroundColor: `${occurrenceHex(first)}12`,
                                                }}
                                              >
                                                <p
                                                  className="truncate text-[11px] font-semibold"
                                                  style={{ color: occurrenceHex(first) }}
                                                >
                                                  {first.templateName?.trim() ||
                                                    WORK_TYPE_LABELS[first.assignmentType]}
                                                </p>
                                                <p className="text-[10px] text-grey-500">
                                                  {first.startTime.slice(0, 5)}–
                                                  {first.endTime.slice(0, 5)}
                                                  {cell.length > 1 ? ` · ${cell.length}` : ""}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ))
                                )}
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
    </div>
  );
}
