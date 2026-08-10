"use client";

import { useMemo, useState } from "react";
import { UserCog, Plus, Minus, AlertTriangle, ArrowLeft } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { PillButton } from "@/components/shared/PillButton";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { SearchableSelect, type SelectOption } from "./SearchableSelect";
import {
  useSiteCleanerProfiles,
  useAssignCleanerProfiles,
  useAddCleanerProfile,
  useRemoveCleanerProfile,
  type ProfileAssignmentInput,
} from "@/features/user-management/hooks/useSiteAssignments";
import { useCleaners } from "@/features/cleaners/hooks/useCleaners";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import type { Site, SiteCleanerProfile } from "@/features/user-management/schemas/site.schema";

const UNASSIGNED = "";

type View = "assign" | "add" | "remove";

function personName(first?: string | null, last?: string | null): string {
  return [first, last].filter(Boolean).join(" ").trim() || "Unnamed";
}

function profileLabel(p: SiteCleanerProfile): string {
  return p.label || `Cleaner ${p.profileIndex}`;
}

function taskCountOf(p: SiteCleanerProfile): number {
  return p.taskCount ?? 0;
}

interface CleanerProfilesModalProps {
  open: boolean;
  onClose: () => void;
  site: Site | null;
}

export function CleanerProfilesModal({ open, onClose, site }: CleanerProfilesModalProps) {
  const profilesQuery = useSiteCleanerProfiles(open ? site?.id : undefined);
  const cleanersQuery = useCleaners();
  const assign = useAssignCleanerProfiles();
  const addProfile = useAddCleanerProfile();
  const removeProfile = useRemoveCleanerProfile();

  const [view, setView] = useState<View>("assign");
  // profileId -> selected cleanerId ("" = unassigned)
  const [selections, setSelections] = useState<Record<string, string>>({});
  // Add view: whether to copy an existing slot's scope, and which slot to copy from.
  const [copyEnabled, setCopyEnabled] = useState(false);
  const [copySourceId, setCopySourceId] = useState<string>("");
  // Remove view: which empty slot to remove.
  const [removeTargetId, setRemoveTargetId] = useState<string>("");

  const profiles = useMemo(
    () => [...(profilesQuery.data ?? [])].sort((a, b) => a.profileIndex - b.profileIndex),
    [profilesQuery.data],
  );

  const emptyProfiles = useMemo(() => profiles.filter((p) => taskCountOf(p) === 0), [profiles]);

  // Sync local selections when the profiles load / modal opens / slots change.
  const loadedKey = useMemo(
    () => profiles.map((p) => `${p.id}:${p.cleanerId ?? ""}`).join("|"),
    [profiles],
  );
  const [syncedKey, setSyncedKey] = useState<string | null>(null);
  if (open && !profilesQuery.isLoading && loadedKey !== syncedKey) {
    setSyncedKey(loadedKey);
    setSelections(Object.fromEntries(profiles.map((p) => [p.id, p.cleanerId ?? UNASSIGNED])));
  }
  if (!open && syncedKey !== null) {
    setSyncedKey(null);
    setSelections({});
    setView("assign");
    setCopyEnabled(false);
    setCopySourceId("");
    setRemoveTargetId("");
    assign.reset();
    addProfile.reset();
    removeProfile.reset();
  }

  const cleanerOptions: SelectOption[] = useMemo(
    () => [
      { value: UNASSIGNED, label: "— Unassigned —" },
      ...(cleanersQuery.data ?? []).map((c) => ({
        value: c.id,
        label: personName(c.firstName, c.lastName),
        sublabel: c.email ?? undefined,
      })),
    ],
    [cleanersQuery.data],
  );

  const copySourceOptions: SelectOption[] = useMemo(
    () =>
      profiles.map((p) => ({
        value: p.id,
        label: profileLabel(p),
        sublabel: `${taskCountOf(p)} task${taskCountOf(p) === 1 ? "" : "s"}${
          p.cleanerName ? ` · ${p.cleanerName}` : ""
        }`,
      })),
    [profiles],
  );

  // A cleaner may only occupy one slot at a time.
  const takenBy = useMemo(() => {
    const map = new Map<string, string>(); // cleanerId -> profileId
    for (const [profileId, cleanerId] of Object.entries(selections)) {
      if (cleanerId) map.set(cleanerId, profileId);
    }
    return map;
  }, [selections]);

  const duplicateCleaner = useMemo(() => {
    const counts = new Map<string, number>();
    for (const cleanerId of Object.values(selections)) {
      if (cleanerId) counts.set(cleanerId, (counts.get(cleanerId) ?? 0) + 1);
    }
    return [...counts.values()].some((n) => n > 1);
  }, [selections]);

  function handleSave() {
    if (!site || duplicateCleaner) return;
    const payload: ProfileAssignmentInput[] = profiles.map((p) => ({
      profileId: p.id,
      cleanerId: selections[p.id] ? selections[p.id] : null,
    }));
    assign.mutate({ siteId: site.id, profiles: payload }, { onSuccess: onClose });
  }

  function handleAdd() {
    if (!site) return;
    if (copyEnabled && !copySourceId) return;
    addProfile.mutate(
      { siteId: site.id, copyFromProfileId: copyEnabled ? copySourceId : null },
      {
        onSuccess: () => {
          setView("assign");
          setCopyEnabled(false);
          setCopySourceId("");
        },
      },
    );
  }

  function handleRemove() {
    if (!site || !removeTargetId) return;
    removeProfile.mutate(
      { siteId: site.id, profileId: removeTargetId },
      {
        onSuccess: () => {
          setView("assign");
          setRemoveTargetId("");
        },
      },
    );
  }

  // Entering the remove view pre-selects the sole empty slot (if there is exactly one).
  function openRemoveView() {
    setRemoveTargetId(emptyProfiles.length === 1 ? emptyProfiles[0]!.id : "");
    removeProfile.reset();
    setView("remove");
  }

  function openAddView() {
    setCopyEnabled(false);
    setCopySourceId("");
    addProfile.reset();
    setView("add");
  }

  const isLoading = profilesQuery.isLoading || cleanersQuery.isLoading;

  const title =
    view === "add"
      ? "Add a cleaner slot"
      : view === "remove"
        ? "Remove a cleaner slot"
        : "Cleaner slots";

  const description = site
    ? view === "assign"
      ? `Cleaner slots for “${site.name}”`
      : `“${site.name}”`
    : undefined;

  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : view === "add" ? (
        // ── Add a cleaner slot (optionally copy an existing slot's scope) ──────────
        <div className="flex flex-col gap-4">
          <p className="rounded-xl bg-grey-50 px-3 py-2 text-xs text-grey-500">
            A new cleaner slot will be created for this site. You can copy an existing cleaner&apos;s
            task scope onto it, so the cleaner you place in the new slot shares those same tasks.
          </p>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-on-surface">
              Copy an existing cleaner&apos;s tasks to the new slot?
            </legend>
            <label className="flex items-center gap-2 text-sm text-on-surface">
              <input
                type="radio"
                name="copy-choice"
                checked={!copyEnabled}
                onChange={() => setCopyEnabled(false)}
              />
              No — start with an empty slot
            </label>
            <label className="flex items-center gap-2 text-sm text-on-surface">
              <input
                type="radio"
                name="copy-choice"
                checked={copyEnabled}
                onChange={() => setCopyEnabled(true)}
                disabled={profiles.length === 0}
              />
              Yes — copy the workforce scope from an existing cleaner
            </label>
          </fieldset>

          {copyEnabled && (
            <SearchableSelect
              label="Copy tasks from"
              options={copySourceOptions}
              value={copySourceId}
              onChange={setCopySourceId}
              placeholder="Select a cleaner slot to copy"
              searchPlaceholder="Search slots…"
              emptyMessage="No slots to copy from"
            />
          )}

          {addProfile.isError && (
            <p className="text-sm text-error">{getErrorMessage(addProfile.error)}</p>
          )}

          <div className="mt-1 flex justify-between gap-2">
            <button
              type="button"
              onClick={() => setView("assign")}
              disabled={addProfile.isPending}
              className="inline-flex items-center gap-1.5 rounded-full border border-grey-300 px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100 disabled:opacity-60"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Back
            </button>
            <PillButton
              type="button"
              variant="teal"
              onClick={handleAdd}
              disabled={addProfile.isPending || (copyEnabled && !copySourceId)}
              className="w-auto px-6"
            >
              <span className="inline-flex items-center gap-2">
                <Plus size={16} aria-hidden="true" />
                {addProfile.isPending ? "Adding…" : "Add slot"}
              </span>
            </PillButton>
          </div>
        </div>
      ) : view === "remove" ? (
        // ── Remove a cleaner slot (only slots without tasks) ──────────────────────
        <div className="flex flex-col gap-4">
          {emptyProfiles.length === 0 ? (
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 px-3 py-3">
              <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
              <p className="text-sm text-amber-800">
                Every cleaner slot has tasks assigned, so none can be removed. To reduce the number of
                cleaners, first release a cleaner from all of its tasks (reassign or remove those
                tasks), then come back here.
              </p>
            </div>
          ) : emptyProfiles.length === 1 ? (
            <div className="flex items-start gap-3 rounded-xl bg-error/5 px-3 py-3">
              <AlertTriangle size={20} className="mt-0.5 shrink-0 text-error" aria-hidden="true" />
              <p className="text-sm text-on-surface">
                <span className="font-semibold">{profileLabel(emptyProfiles[0]!)}</span> has no tasks
                assigned and will be removed.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-grey-500">
                More than one slot has no tasks assigned. Choose which one to remove:
              </p>
              <div className="flex flex-col gap-1.5">
                {emptyProfiles.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 rounded-xl border border-grey-200 px-3 py-2.5 text-sm text-on-surface hover:bg-grey-50"
                  >
                    <input
                      type="radio"
                      name="remove-target"
                      checked={removeTargetId === p.id}
                      onChange={() => setRemoveTargetId(p.id)}
                    />
                    <span className="font-medium">{profileLabel(p)}</span>
                    {p.cleanerName && <span className="text-grey-500">· {p.cleanerName}</span>}
                    <span className="ml-auto text-xs text-grey-400">No tasks</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {removeProfile.isError && (
            <p className="text-sm text-error">{getErrorMessage(removeProfile.error)}</p>
          )}

          <div className="mt-1 flex justify-between gap-2">
            <button
              type="button"
              onClick={() => setView("assign")}
              disabled={removeProfile.isPending}
              className="inline-flex items-center gap-1.5 rounded-full border border-grey-300 px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100 disabled:opacity-60"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Back
            </button>
            {emptyProfiles.length > 0 && (
              <PillButton
                type="button"
                variant="orange"
                onClick={handleRemove}
                disabled={removeProfile.isPending || !removeTargetId}
                className="w-auto px-6 !bg-error"
              >
                <span className="inline-flex items-center gap-2">
                  <Minus size={16} aria-hidden="true" />
                  {removeProfile.isPending ? "Removing…" : "Remove slot"}
                </span>
              </PillButton>
            )}
          </div>
        </div>
      ) : profiles.length === 0 ? (
        // ── No slots yet ──────────────────────────────────────────────────────────
        <div className="flex flex-col gap-4">
          <p className="py-6 text-center text-sm text-grey-500">
            This site has no cleaner slots yet.
          </p>
          <div className="flex justify-center">
            <PillButton type="button" variant="teal" onClick={openAddView} className="w-auto px-6">
              <span className="inline-flex items-center gap-2">
                <Plus size={16} aria-hidden="true" />
                Add a cleaner slot
              </span>
            </PillButton>
          </div>
        </div>
      ) : (
        // ── Assign cleaners to slots ──────────────────────────────────────────────
        <div className="flex flex-col gap-4">
          <p className="rounded-xl bg-grey-50 px-3 py-2 text-xs text-grey-500">
            Each slot holds one cleaner. Switching a cleaner here reassigns all of that slot’s future
            tasks to the new cleaner — past completions are preserved.
          </p>

          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-on-surface">
              {profiles.length} cleaner slot{profiles.length === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openAddView}
                className="inline-flex items-center gap-1.5 rounded-full border border-teal-500 px-3 py-1.5 text-xs font-semibold text-teal-600 transition-colors hover:bg-teal-50"
              >
                <Plus size={14} aria-hidden="true" />
                Add cleaner
              </button>
              <button
                type="button"
                onClick={openRemoveView}
                className="inline-flex items-center gap-1.5 rounded-full border border-grey-300 px-3 py-1.5 text-xs font-semibold text-on-surface transition-colors hover:bg-grey-100"
              >
                <Minus size={14} aria-hidden="true" />
                Remove cleaner
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {profiles.map((p) => {
              const current = selections[p.id] ?? UNASSIGNED;
              const conflictProfileId = current ? takenBy.get(current) : undefined;
              const hasConflict =
                !!current && conflictProfileId !== p.id && conflictProfileId !== undefined;
              const count = taskCountOf(p);
              return (
                <div key={p.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-on-surface">{profileLabel(p)}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        count === 0 ? "bg-grey-100 text-grey-500" : "bg-teal-50 text-teal-700"
                      }`}
                    >
                      {count === 0 ? "No tasks" : `${count} task${count === 1 ? "" : "s"}`}
                    </span>
                  </div>
                  <SearchableSelect
                    options={cleanerOptions}
                    value={current}
                    onChange={(value) => setSelections((prev) => ({ ...prev, [p.id]: value }))}
                    placeholder="Select a cleaner"
                    searchPlaceholder="Search cleaners…"
                    emptyMessage="No cleaners available"
                    error={
                      hasConflict ? "This cleaner is already assigned to another slot." : undefined
                    }
                  />
                </div>
              );
            })}
          </div>

          {assign.isError && <p className="text-sm text-error">{getErrorMessage(assign.error)}</p>}

          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={assign.isPending}
              className="rounded-full border border-grey-300 px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100 disabled:opacity-60"
            >
              Cancel
            </button>
            <PillButton
              type="button"
              variant="teal"
              onClick={handleSave}
              disabled={assign.isPending || duplicateCleaner}
              className="w-auto px-6"
            >
              <span className="inline-flex items-center gap-2">
                <UserCog size={16} aria-hidden="true" />
                {assign.isPending ? "Saving…" : "Save slots"}
              </span>
            </PillButton>
          </div>
        </div>
      )}
    </Modal>
  );
}
