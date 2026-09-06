"use client";

import { useMemo, useState } from "react";
import { Handshake } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { PillButton } from "@/components/shared/PillButton";
import { TextField } from "@/components/shared/TextField";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { SearchableSelect, type SelectOption } from "@/features/user-management/components/SearchableSelect";
import { useSites } from "@/features/user-management/hooks/useSites";
import { useFloors } from "@/features/user-management/hooks/useFloors";
import { useAreas } from "@/features/user-management/hooks/useAreas";
import { useOccurrences } from "@/features/workforce/hooks/useAssignments";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useCreateOutsourceProject } from "@/features/outsource/hooks/useOutsourceProjects";
import {
  OUTSOURCE_SCOPE_LABELS,
  type OutsourceScopeType,
} from "@/features/outsource/schemas/outsourceProject.schema";

const SCOPE_TABS: OutsourceScopeType[] = ["SITE", "FLOORS", "AREAS", "TASKS"];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, days: number): Date {
  const n = new Date(d);
  n.setDate(n.getDate() + days);
  return n;
}

interface OutsourceProjectModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (companyName: string) => void;
}

export function OutsourceProjectModal({ open, onClose, onCreated }: OutsourceProjectModalProps) {
  const create = useCreateOutsourceProject();

  const [companyName, setCompanyName] = useState("");
  const [contactPersonName, setContactPersonName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [siteId, setSiteId] = useState("");
  const [scopeType, setScopeType] = useState<OutsourceScopeType>("SITE");
  const [floorIds, setFloorIds] = useState<string[]>([]);
  const [areaIds, setAreaIds] = useState<string[]>([]);
  const [taskIds, setTaskIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(toISODate(new Date()));
  const [endDate, setEndDate] = useState("");
  const [numberOfOutsourceCleaners, setNumberOfOutsourceCleaners] = useState(1);
  const [numberOfOutsourceSupervisors, setNumberOfOutsourceSupervisors] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);

  const sitesQuery = useSites();
  const floorsQuery = useFloors(siteId || undefined);
  const areasQuery = useAreas(undefined, { enabled: !!siteId && scopeType === "AREAS" });
  const taskWindow = useMemo(() => {
    const today = new Date();
    return { from: toISODate(today), to: toISODate(addDays(today, 180)) };
  }, []);
  const occurrencesQuery = useOccurrences(
    siteId && scopeType === "TASKS" ? { ...taskWindow, siteId } : undefined,
  );

  const siteOptions: SelectOption[] = useMemo(
    () =>
      (sitesQuery.data ?? []).map((s) => ({
        value: s.id,
        label: s.name,
        sublabel: s.siteType === "HOTEL" ? "Hotel" : undefined,
      })),
    [sitesQuery.data],
  );

  const floors = useMemo(
    () => [...(floorsQuery.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [floorsQuery.data],
  );
  const siteFloorIds = useMemo(() => new Set(floors.map((f) => f.id)), [floors]);
  const areas = useMemo(
    () =>
      [...(areasQuery.data ?? [])]
        .filter((a) => siteFloorIds.has(a.floorId))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [areasQuery.data, siteFloorIds],
  );

  // Distinct tasks across the upcoming window (id + label).
  const tasks = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    for (const o of occurrencesQuery.data ?? []) {
      if (!map.has(o.taskId)) {
        map.set(o.taskId, { id: o.taskId, label: `${o.name} · ${o.floorName} / ${o.areaName}` });
      }
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [occurrencesQuery.data]);

  function resetSiteDependent() {
    setFloorIds([]);
    setAreaIds([]);
    setTaskIds([]);
  }

  function toggle(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  function resetAll() {
    setCompanyName("");
    setContactPersonName("");
    setContactNumber("");
    setSiteId("");
    setScopeType("SITE");
    resetSiteDependent();
    setStartDate(toISODate(new Date()));
    setEndDate("");
    setNumberOfOutsourceCleaners(1);
    setNumberOfOutsourceSupervisors(1);
    setFormError(null);
    create.reset();
  }

  function handleClose() {
    if (create.isPending) return;
    resetAll();
    onClose();
  }

  function validate(): string | null {
    if (!companyName.trim()) return "Enter the outsource company name.";
    if (!siteId) return "Select a site.";
    if (!startDate) return "Select a start date.";
    if (!endDate) return "Select an end date.";
    if (endDate < startDate) return "End date cannot be before the start date.";
    if (scopeType === "FLOORS" && floorIds.length === 0) return "Select at least one floor.";
    if (scopeType === "AREAS" && areaIds.length === 0) return "Select at least one area.";
    if (scopeType === "TASKS" && taskIds.length === 0) return "Select at least one task.";
    return null;
  }

  function handleSubmit() {
    const error = validate();
    if (error) {
      setFormError(error);
      return;
    }
    setFormError(null);
    create.mutate(
      {
        companyName: companyName.trim(),
        contactPersonName: contactPersonName.trim() || undefined,
        contactNumber: contactNumber.trim() || undefined,
        siteId,
        scopeType,
        floorIds: scopeType === "FLOORS" ? floorIds : undefined,
        areaIds: scopeType === "AREAS" ? areaIds : undefined,
        taskIds: scopeType === "TASKS" ? taskIds : undefined,
        startDate,
        endDate,
        numberOfOutsourceCleaners,
        numberOfOutsourceSupervisors,
      },
      {
        onSuccess: () => {
          const name = companyName.trim();
          resetAll();
          onCreated?.(name);
          onClose();
        },
      },
    );
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New outsource project"
      description="Outsource a site, floors, areas or specific tasks to an external provider."
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Outsource company name"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
          <TextField
            label="Contact person"
            value={contactPersonName}
            onChange={(e) => setContactPersonName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Contact number"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
          />
          <SearchableSelect
            label="Site"
            required
            options={siteOptions}
            value={siteId}
            onChange={(value) => {
              setSiteId(value);
              resetSiteDependent();
            }}
            placeholder="Select a site"
            searchPlaceholder="Search sites…"
            emptyMessage="No sites"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-on-surface">Outsource scope</span>
          <FilterTabs<OutsourceScopeType>
            options={SCOPE_TABS}
            value={scopeType}
            onChange={(value) => {
              setScopeType(value);
              resetSiteDependent();
            }}
            getLabel={(v) => OUTSOURCE_SCOPE_LABELS[v]}
          />
        </div>

        {!siteId && scopeType !== "SITE" && (
          <p className="rounded-lg bg-grey-50 px-3 py-2 text-xs text-grey-500">Select a site first.</p>
        )}

        {siteId && scopeType === "FLOORS" && (
          <ScopeChecklist
            title="Floors"
            loading={floorsQuery.isLoading}
            empty="This site has no floors."
            items={floors.map((f) => ({ id: f.id, label: f.name }))}
            selected={floorIds}
            onToggle={(id) => setFloorIds((prev) => toggle(prev, id))}
          />
        )}

        {siteId && scopeType === "AREAS" && (
          <ScopeChecklist
            title="Areas"
            loading={areasQuery.isLoading}
            empty="This site has no areas."
            items={areas.map((a) => ({ id: a.id, label: a.name }))}
            selected={areaIds}
            onToggle={(id) => setAreaIds((prev) => toggle(prev, id))}
          />
        )}

        {siteId && scopeType === "TASKS" && (
          <ScopeChecklist
            title="Tasks (next 180 days)"
            loading={occurrencesQuery.isLoading}
            empty="No upcoming tasks found for this site."
            items={tasks}
            selected={taskIds}
            onToggle={(id) => setTaskIds((prev) => toggle(prev, id))}
          />
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Start date"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <TextField
            label="End date"
            type="date"
            required
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="rounded-xl border border-grey-200 bg-grey-50 p-3">
          <p className="mb-2 text-xs text-grey-500">
            Set how many outsource cleaner and supervisor slots this project has. Assign the actual
            outsource staff to those slots after creating the project.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="Outsource cleaner slots"
              type="number"
              min={0}
              max={100}
              value={String(numberOfOutsourceCleaners)}
              onChange={(e) => setNumberOfOutsourceCleaners(Math.max(0, Number(e.target.value) || 0))}
            />
            <TextField
              label="Outsource supervisor slots"
              type="number"
              min={0}
              max={100}
              value={String(numberOfOutsourceSupervisors)}
              onChange={(e) => setNumberOfOutsourceSupervisors(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
        </div>

        {(formError || create.isError) && (
          <p className="text-sm text-error">{formError ?? getErrorMessage(create.error)}</p>
        )}

        <div className="mt-1 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={create.isPending}
            className="rounded-full border border-grey-300 px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100 disabled:opacity-60"
          >
            Cancel
          </button>
          <PillButton
            type="button"
            variant="teal"
            onClick={handleSubmit}
            disabled={create.isPending}
            className="w-auto px-6"
          >
            <span className="inline-flex items-center gap-2">
              <Handshake size={16} aria-hidden="true" />
              {create.isPending ? "Creating…" : "Create project"}
            </span>
          </PillButton>
        </div>
      </div>
    </Modal>
  );
}

interface ScopeChecklistProps {
  title: string;
  loading: boolean;
  empty: string;
  items: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}

function ScopeChecklist({ title, loading, empty, items, selected, onToggle }: ScopeChecklistProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-grey-500">
        {title}
        {selected.length > 0 ? ` · ${selected.length} selected` : ""}
      </span>
      <div className="max-h-48 overflow-y-auto rounded-xl border border-grey-200 p-1.5">
        {loading ? (
          <p className="px-2 py-3 text-sm text-grey-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="px-2 py-3 text-sm text-grey-500">{empty}</p>
        ) : (
          items.map((it) => (
            <label
              key={it.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-on-surface hover:bg-grey-50"
            >
              <input
                type="checkbox"
                checked={selected.includes(it.id)}
                onChange={() => onToggle(it.id)}
              />
              <span className="truncate">{it.label}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
