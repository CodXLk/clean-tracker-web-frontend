"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { PillButton } from "@/components/shared/PillButton";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  useSiteCleanerProfiles,
  useSiteSupervisorProfiles,
} from "@/features/user-management/hooks/useSiteAssignments";
import { useInventoryItems } from "@/features/inventory/hooks/useInventory";
import { useEditOccurrenceContent } from "@/features/workforce/hooks/useAssignments";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import type { TaskOccurrence, OccurrenceScope } from "@/features/workforce/schemas/assignment.schema";
import { cn } from "@/lib/utils/cn";

interface EditOccurrenceModalProps {
  occurrence: TaskOccurrence | null;
  onClose: () => void;
}

const SCOPE_OPTIONS: { scope: OccurrenceScope; label: string; hint: string }[] = [
  { scope: "ALL", label: "All tasks", hint: "Edit this task in place for every occurrence." },
  {
    scope: "THIS_AND_FOLLOWING",
    label: "This and future tasks",
    hint: "Split from this date into a new series and edit that.",
  },
  { scope: "THIS", label: "This task only", hint: "Split only this date into its own one-off task." },
];

export function EditOccurrenceModal({ occurrence, onClose }: EditOccurrenceModalProps) {
  const open = !!occurrence;
  const siteId = occurrence?.siteId;
  const cleanerProfilesQuery = useSiteCleanerProfiles(open ? siteId : undefined);
  const supervisorProfilesQuery = useSiteSupervisorProfiles(open ? siteId : undefined);
  const itemsQuery = useInventoryItems(true);
  const editContent = useEditOccurrenceContent();

  const [name, setName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [description, setDescription] = useState("");
  const [profileIds, setProfileIds] = useState<Set<string>>(new Set());
  const [supervisorIds, setSupervisorIds] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<{ itemId: string; quantity: number }[]>([]);
  const [scope, setScope] = useState<OccurrenceScope>("THIS");

  // Prefill when the modal opens for a different occurrence.
  const key = occurrence ? `${occurrence.taskId}_${occurrence.occurrenceDate}` : null;
  const [syncedKey, setSyncedKey] = useState<string | null>(null);
  if (open && key !== syncedKey) {
    setSyncedKey(key);
    setName(occurrence!.name);
    setDurationMinutes(occurrence!.durationMinutes);
    setDescription(occurrence!.description ?? "");
    setProfileIds(new Set(occurrence!.cleanerProfiles.map((p) => p.id)));
    setSupervisorIds(new Set(occurrence!.supervisorProfiles.map((p) => p.id)));
    setItems(occurrence!.items.map((it) => ({ itemId: it.itemId, quantity: it.quantity })));
    // Default to editing the task in place; the user can opt into a single-occurrence/future split.
    setScope("ALL");
    editContent.reset();
  }
  if (!open && syncedKey !== null) {
    setSyncedKey(null);
  }

  function toggle(current: Set<string>, id: string, setter: (s: Set<string>) => void) {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  }

  function addItem() {
    setItems((prev) => [...prev, { itemId: "", quantity: 1 }]);
  }

  function handleSave() {
    if (!occurrence) return;
    editContent.mutate(
      {
        taskId: occurrence.taskId,
        occurrenceDate: occurrence.occurrenceDate,
        input: {
          scope,
          name: name.trim() || undefined,
          durationMinutes,
          description: description.trim(),
          profileIds: [...profileIds],
          supervisorIds: [...supervisorIds],
          items: items.filter((i) => i.itemId && i.quantity > 0),
        },
      },
      { onSuccess: onClose },
    );
  }

  const isLoading =
    cleanerProfilesQuery.isLoading || supervisorProfilesQuery.isLoading || itemsQuery.isLoading;
  const cleanerProfiles = cleanerProfilesQuery.data ?? [];
  const supervisorProfiles = (supervisorProfilesQuery.data ?? []).filter((p) => p.supervisorId);
  const inventoryItems = itemsQuery.data ?? [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit task"
      description={occurrence ? `${occurrence.name} · ${occurrence.date}` : undefined}
    >
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Name + duration */}
          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-xs font-medium text-grey-500">Task name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg border border-grey-300 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="flex w-28 flex-col gap-1">
              <span className="text-xs font-medium text-grey-500">Minutes</span>
              <input
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="rounded-lg border border-grey-300 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
          </div>

          {/* Description */}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-grey-500">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="resize-none rounded-lg border border-grey-300 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>

          {/* Cleaner profiles */}
          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs font-medium text-grey-500">
              Cleaner profiles {profileIds.size === 0 && "(none = shared across all site cleaners)"}
            </legend>
            {cleanerProfiles.length === 0 ? (
              <p className="text-xs text-grey-500">No cleaner slots on this site.</p>
            ) : (
              cleanerProfiles.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm text-on-surface">
                  <input
                    type="checkbox"
                    checked={profileIds.has(p.id)}
                    onChange={() => toggle(profileIds, p.id, setProfileIds)}
                  />
                  <span className="font-medium">{p.label}</span>
                  <span className="text-grey-500">{p.cleanerName ?? "Vacant"}</span>
                </label>
              ))
            )}
          </fieldset>

          {/* Supervisors */}
          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs font-medium text-grey-500">
              Supervisors {supervisorIds.size === 0 && "(none = all site supervisors)"}
            </legend>
            {supervisorProfiles.length === 0 ? (
              <p className="text-xs text-grey-500">No supervisor slots filled on this site.</p>
            ) : (
              supervisorProfiles.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm text-on-surface">
                  <input
                    type="checkbox"
                    checked={supervisorIds.has(p.supervisorId!)}
                    onChange={() => toggle(supervisorIds, p.supervisorId!, setSupervisorIds)}
                  />
                  <span className="font-medium">{p.label}</span>
                  <span className="text-grey-500">{p.supervisorName}</span>
                </label>
              ))
            )}
          </fieldset>

          {/* Items */}
          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs font-medium text-grey-500">Expected items</legend>
            {items.map((row, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={row.itemId}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, itemId: e.target.value } : r)),
                    )
                  }
                  className="flex-1 rounded-lg border border-grey-300 px-2 py-1.5 text-sm outline-none focus:border-primary"
                >
                  <option value="">Select an item…</option>
                  {inventoryItems.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name} ({it.unit})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  step="0.001"
                  value={row.quantity}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, quantity: Number(e.target.value) } : r)),
                    )
                  }
                  className="w-24 rounded-lg border border-grey-300 px-2 py-1.5 text-sm outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-500 hover:bg-grey-100"
                  aria-label="Remove item"
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addItem}
              className="flex w-fit items-center gap-1 rounded-full border border-grey-300 px-3 py-1.5 text-sm font-medium text-on-surface hover:bg-grey-100"
            >
              <Plus size={15} aria-hidden="true" /> Add item
            </button>
          </fieldset>

          {/* Scope — only meaningful for recurring occurrences */}
          {occurrence?.recurring && (
            <fieldset className="flex flex-col gap-2 rounded-xl bg-grey-50 p-3">
              <legend className="px-1 text-xs font-medium text-grey-500">Apply changes to</legend>
              {SCOPE_OPTIONS.map((o) => (
                <label key={o.scope} className="flex items-start gap-2 text-sm text-on-surface">
                  <input
                    type="radio"
                    name="edit-scope"
                    className="mt-0.5"
                    checked={scope === o.scope}
                    onChange={() => setScope(o.scope)}
                  />
                  <span>
                    <span className="font-medium">{o.label}</span>
                    <span className="block text-xs text-grey-500">{o.hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          )}

          {editContent.isError && (
            <p className="text-sm text-error">{getErrorMessage(editContent.error)}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-grey-300 px-4 py-2 text-sm font-medium text-on-surface hover:bg-grey-100"
            >
              Cancel
            </button>
            <PillButton
              variant="teal"
              onClick={handleSave}
              disabled={editContent.isPending}
              className={cn("!h-11 !w-auto !px-6")}
            >
              {editContent.isPending ? "Saving…" : "Save changes"}
            </PillButton>
          </div>
        </div>
      )}
    </Modal>
  );
}
