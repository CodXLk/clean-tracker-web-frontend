"use client";

import { useEffect, useMemo, useState } from "react";
import { Layers, Check } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { PillButton } from "@/components/shared/PillButton";
import { cn } from "@/lib/utils/cn";
import {
  useCreateAreaGroup,
  useUpdateAreaGroup,
} from "@/features/user-management/hooks/useAreaGroups";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import type { Area, AreaGroup } from "@/features/user-management/schemas/area.schema";
import type { Floor } from "@/features/user-management/schemas/floor.schema";

interface AreaGroupModalProps {
  open: boolean;
  floor: Floor;
  /** All areas on the floor (grouped and ungrouped). */
  areas: Area[];
  /** Present when editing an existing group. */
  group?: AreaGroup | null;
  onClose: () => void;
}

/** Create or edit an area group: name it and pick which of the floor's areas belong to it. */
export function AreaGroupModal({ open, floor, areas, group, onClose }: AreaGroupModalProps) {
  const isEdit = !!group;
  const createGroup = useCreateAreaGroup();
  const updateGroup = useUpdateAreaGroup();
  const mutation = isEdit ? updateGroup : createGroup;

  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(group?.name ?? "");
    setSelected(new Set(group?.areas.map((a) => a.id) ?? []));
    setTouched(false);
  }, [open, group]);

  // Areas selectable for this group: ungrouped areas + areas already in this group.
  const selectableAreas = useMemo(
    () => areas.filter((a) => !a.areaGroupId || a.areaGroupId === group?.id),
    [areas, group?.id],
  );

  function toggle(areaId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(areaId)) next.delete(areaId);
      else next.add(areaId);
      return next;
    });
  }

  const nameError = touched && name.trim().length < 2 ? "Name must be at least 2 characters" : "";

  function submit() {
    setTouched(true);
    if (name.trim().length < 2) return;
    const areaIds = Array.from(selected);
    if (isEdit && group) {
      updateGroup.mutate(
        { id: group.id, input: { name: name.trim(), areaIds } },
        { onSuccess: onClose },
      );
    } else {
      createGroup.mutate(
        { floorId: floor.id, input: { name: name.trim(), areaIds } },
        { onSuccess: onClose },
      );
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit area group" : "New area group"}
      description={`Group areas on ${floor.name} so identical tasks are managed and completed together.`}
    >
      <div className="flex flex-col gap-4">
        <TextField
          label="Group name"
          placeholder="e.g. Classrooms"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched(true)}
          error={nameError || undefined}
        />

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-on-surface">Areas in this group</p>
          {selectableAreas.length === 0 ? (
            <p className="rounded-xl bg-grey-50 px-3 py-3 text-sm text-grey-500">
              No available areas on this floor. Add areas first, or free them from another group.
            </p>
          ) : (
            <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
              {selectableAreas.map((area) => {
                const isOn = selected.has(area.id);
                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => toggle(area.id)}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                      isOn
                        ? "border-primary bg-primary/10 text-ink"
                        : "border-line bg-surface text-on-surface hover:bg-surface-muted",
                    )}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Layers size={14} className="text-body-2" aria-hidden="true" />
                      {area.name}
                    </span>
                    {isOn && <Check size={16} className="text-primary" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          )}
          <p className="text-[11px] text-grey-500">{selected.size} area(s) selected</p>
        </div>

        {mutation.isError && (
          <p role="alert" className="rounded-xl bg-error/10 px-3 py-2 text-sm font-medium text-error">
            {getErrorMessage(mutation.error)}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="h-11 flex-1 rounded-xl border border-line text-sm font-semibold text-ink transition-colors hover:bg-surface-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <PillButton variant="teal" className="flex-1" onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create group"}
          </PillButton>
        </div>
      </div>
    </Modal>
  );
}
