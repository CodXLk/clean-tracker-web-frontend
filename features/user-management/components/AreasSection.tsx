"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { ConfirmDialog } from "./ConfirmDialog";
import { useAreas, useCreateArea, useDeleteArea, useUpdateArea } from "@/features/user-management/hooks/useAreas";
import type { Area } from "@/features/user-management/schemas/area.schema";

interface AreasSectionProps {
  floorId: string;
}

export function AreasSection({ floorId }: AreasSectionProps) {
  const areasQuery = useAreas(floorId);
  const createMutation = useCreateArea();
  const updateMutation = useUpdateArea();
  const deleteMutation = useDeleteArea();

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleting, setDeleting] = useState<Area | null>(null);

  const areas = areasQuery.data ?? [];

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    createMutation.mutate(
      { floorId, input: { name } },
      { onSuccess: () => setNewName("") },
    );
  }

  function startEdit(area: Area) {
    setEditingId(area.id);
    setEditingName(area.name);
    updateMutation.reset();
  }

  function saveEdit() {
    const name = editingName.trim();
    if (!editingId || !name) return;
    updateMutation.mutate(
      { id: editingId, input: { name } },
      { onSuccess: () => setEditingId(null) },
    );
  }

  function confirmDelete() {
    if (!deleting) return;
    deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-grey-500">Areas</span>

      {areasQuery.isLoading && (
        <div className="flex justify-center py-2">
          <LoadingSpinner size={16} />
        </div>
      )}
      {areasQuery.isError && <p className="text-xs text-error">Failed to load areas.</p>}
      {!areasQuery.isLoading && areas.length === 0 && (
        <p className="text-xs text-grey-500">No areas yet.</p>
      )}

      <ul className="flex flex-col gap-1.5">
        {areas.map((area) => (
          <li
            key={area.id}
            className="flex items-center gap-2 rounded-lg border border-grey-200 bg-white px-2.5 py-1.5"
          >
            {editingId === area.id ? (
              <>
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="h-7 flex-1 rounded-md border border-grey-300 bg-white px-2 text-xs text-on-surface outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={updateMutation.isPending}
                  aria-label="Save area name"
                  className="flex h-6 w-6 items-center justify-center rounded-md text-primary hover:bg-primary/10"
                >
                  <Check size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  aria-label="Cancel editing"
                  className="flex h-6 w-6 items-center justify-center rounded-md text-grey-500 hover:bg-grey-100"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-xs font-medium text-on-surface">{area.name}</span>
                <button
                  type="button"
                  onClick={() => startEdit(area)}
                  aria-label="Edit area"
                  className="flex h-6 w-6 items-center justify-center rounded-md text-grey-500 hover:bg-primary/10 hover:text-primary"
                >
                  <Pencil size={13} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(area)}
                  aria-label="Delete area"
                  className="flex h-6 w-6 items-center justify-center rounded-md text-grey-500 hover:bg-error/10 hover:text-error"
                >
                  <Trash2 size={13} aria-hidden="true" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      {updateMutation.isError && editingId === null && (
        <p className="text-xs text-error">{getErrorMessage(updateMutation.error)}</p>
      )}

      <div className="flex items-center gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="New area name"
          className="h-7 flex-1 rounded-md border border-grey-300 bg-white px-2 text-xs text-on-surface outline-none placeholder:text-grey-500/60 focus:border-primary"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={createMutation.isPending || !newName.trim()}
          className="flex h-7 items-center gap-1 rounded-md bg-primary/10 px-2 text-xs font-semibold text-primary hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={13} aria-hidden="true" />
          Add
        </button>
      </div>
      {createMutation.isError && <p className="text-xs text-error">{getErrorMessage(createMutation.error)}</p>}

      <ConfirmDialog
        open={!!deleting}
        title="Delete area"
        description={`Are you sure you want to delete "${deleting?.name}"? This action cannot be undone.`}
        isPending={deleteMutation.isPending}
        error={deleteMutation.isError ? getErrorMessage(deleteMutation.error) : undefined}
        onConfirm={confirmDelete}
        onClose={() => {
          setDeleting(null);
          deleteMutation.reset();
        }}
      />
    </div>
  );
}
