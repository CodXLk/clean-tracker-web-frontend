"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronRight, LayoutGrid, Pencil, Plus, Trash2, X } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { ConfirmDialog } from "./ConfirmDialog";
import { AreasSection } from "./AreasSection";
import { useCreateFloor, useDeleteFloor, useFloors, useUpdateFloor } from "@/features/user-management/hooks/useFloors";
import type { Floor } from "@/features/user-management/schemas/floor.schema";

interface FloorsSectionProps {
  siteId: string;
  /**
   * When provided, each floor row gets a "manage areas" button that calls this instead of
   * expanding an inline areas list — used to hand off to a separate Areas modal.
   */
  onManageAreas?: (floor: Floor) => void;
}

export function FloorsSection({ siteId, onManageAreas }: FloorsSectionProps) {
  const floorsQuery = useFloors(siteId);
  const createMutation = useCreateFloor();
  const updateMutation = useUpdateFloor();
  const deleteMutation = useDeleteFloor();

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleting, setDeleting] = useState<Floor | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const floors = floorsQuery.data ?? [];

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    createMutation.mutate(
      { siteId, input: { name } },
      { onSuccess: () => setNewName("") },
    );
  }

  function startEdit(floor: Floor) {
    setEditingId(floor.id);
    setEditingName(floor.name);
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
    <div className="rounded-xl border border-grey-200 bg-grey-50 p-3">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-grey-500">Floors</span>

      {floorsQuery.isLoading && (
        <div className="flex justify-center py-3">
          <LoadingSpinner size={18} />
        </div>
      )}
      {floorsQuery.isError && <p className="text-xs text-error">Failed to load floors.</p>}
      {!floorsQuery.isLoading && floors.length === 0 && (
        <p className="mb-2 text-xs text-grey-500">No floors yet. Add the first one below.</p>
      )}

      <ul className="flex flex-col gap-2">
        {floors.map((floor) => {
          const expanded = expandedId === floor.id;
          return (
            <li key={floor.id} className="rounded-lg border border-grey-200 bg-white">
              <div className="flex items-center gap-2 px-2.5 py-2">
                {onManageAreas ? (
                  <button
                    type="button"
                    onClick={() => onManageAreas(floor)}
                    aria-label="Manage areas"
                    title="Manage areas"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-grey-500 hover:bg-primary/10 hover:text-primary"
                  >
                    <LayoutGrid size={14} aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : floor.id)}
                    aria-label={expanded ? "Collapse areas" : "Expand areas"}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-grey-500 hover:bg-grey-100"
                  >
                    {expanded ? (
                      <ChevronDown size={14} aria-hidden="true" />
                    ) : (
                      <ChevronRight size={14} aria-hidden="true" />
                    )}
                  </button>
                )}

                {editingId === floor.id ? (
                  <>
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="h-7 flex-1 rounded-md border border-grey-300 bg-white px-2 text-sm text-on-surface outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={updateMutation.isPending}
                      aria-label="Save floor name"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-primary hover:bg-primary/10"
                    >
                      <Check size={15} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      aria-label="Cancel editing"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-grey-500 hover:bg-grey-100"
                    >
                      <X size={15} aria-hidden="true" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-on-surface">{floor.name}</span>
                    <button
                      type="button"
                      onClick={() => startEdit(floor)}
                      aria-label="Edit floor"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-grey-500 hover:bg-primary/10 hover:text-primary"
                    >
                      <Pencil size={14} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(floor)}
                      aria-label="Delete floor"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-grey-500 hover:bg-error/10 hover:text-error"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </>
                )}
              </div>

              {!onManageAreas && expanded && (
                <div className="border-t border-grey-100 px-2.5 py-2">
                  <AreasSection floorId={floor.id} />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {updateMutation.isError && editingId === null && (
        <p className="mt-2 text-xs text-error">{getErrorMessage(updateMutation.error)}</p>
      )}

      <div className="mt-2 flex items-center gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="New floor name"
          className="h-8 flex-1 rounded-md border border-grey-300 bg-white px-2.5 text-sm text-on-surface outline-none placeholder:text-grey-500/60 focus:border-primary"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={createMutation.isPending || !newName.trim()}
          className="flex h-8 items-center gap-1 rounded-md bg-primary/10 px-2.5 text-xs font-semibold text-primary hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={14} aria-hidden="true" />
          Add floor
        </button>
      </div>
      {createMutation.isError && <p className="mt-1 text-xs text-error">{getErrorMessage(createMutation.error)}</p>}

      <ConfirmDialog
        open={!!deleting}
        title="Delete floor"
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
