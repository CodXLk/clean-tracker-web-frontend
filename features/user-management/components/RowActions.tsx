"use client";

import { Pencil, Trash2 } from "lucide-react";

interface RowActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  editLabel?: string;
  deleteLabel?: string;
}

export function RowActions({ onEdit, onDelete, editLabel = "Edit", deleteLabel = "Delete" }: RowActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={onEdit}
        aria-label={editLabel}
        title={editLabel}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Pencil size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={deleteLabel}
        title={deleteLabel}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-error/10 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
