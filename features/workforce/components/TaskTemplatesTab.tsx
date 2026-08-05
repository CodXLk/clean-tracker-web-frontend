"use client";

import { useState } from "react";
import { ListChecks, Plus, Pencil, Trash2, Clock } from "lucide-react";
import { useTaskTemplates, useDeleteTaskTemplate } from "@/features/workforce/hooks/useTaskTemplates";
import { TaskTemplateModal } from "@/features/workforce/components/TaskTemplateModal";
import type { TaskTemplate } from "@/features/workforce/schemas/taskTemplate.schema";

function totalDuration(template: TaskTemplate): number {
  return template.tasks.reduce((sum, t) => sum + (t.durationMinutes ?? 0), 0);
}

export function TaskTemplatesTab() {
  const templatesQuery = useTaskTemplates();
  const deleteMutation = useDeleteTaskTemplate();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TaskTemplate | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TaskTemplate | null>(null);

  const templates = templatesQuery.data ?? [];

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(template: TaskTemplate) {
    setEditing(template);
    setModalOpen(true);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.id);
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-on-surface">Task List Templates</h2>
          <p className="text-sm text-grey-500">
            Reusable task lists you can load when creating assignments or cleaning schedules.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Plus size={16} aria-hidden="true" />
          New Template
        </button>
      </div>

      {/* Content */}
      {templatesQuery.isLoading ? (
        <p className="text-sm text-grey-500">Loading templates…</p>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-grey-300 bg-grey-50 px-6 py-16 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ListChecks size={24} aria-hidden="true" />
          </span>
          <h3 className="text-sm font-semibold text-on-surface">No templates yet</h3>
          <p className="mt-1 max-w-sm text-sm text-grey-500">
            Create a task list template to quickly reuse a set of tasks across assignments.
          </p>
          <button
            type="button"
            onClick={openNew}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-variant"
          >
            <Plus size={16} aria-hidden="true" />
            New Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => {
            const mins = totalDuration(template);
            return (
              <div
                key={template.id}
                className="flex flex-col rounded-2xl border border-grey-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-on-surface">{template.name}</h3>
                    <p className="mt-0.5 text-xs text-grey-500">
                      {template.tasks.length} {template.tasks.length === 1 ? "task" : "tasks"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      aria-label="Edit template"
                      onClick={() => openEdit(template)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      <Pencil size={15} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete template"
                      onClick={() => setPendingDelete(template)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-red-50 hover:text-danger"
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {template.tasks.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-1">
                    {template.tasks.slice(0, 4).map((t, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-grey-600">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
                        <span className="truncate">{t.name}</span>
                      </li>
                    ))}
                    {template.tasks.length > 4 && (
                      <li className="text-xs text-grey-400">+{template.tasks.length - 4} more</li>
                    )}
                  </ul>
                )}

                <div className="mt-4 flex items-center gap-3 border-t border-grey-100 pt-3 text-xs text-grey-500">
                  {mins > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Clock size={13} aria-hidden="true" />
                      {mins} min
                    </span>
                  )}
                  {template.updatedByName && (
                    <span className="truncate">Updated by {template.updatedByName}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor modal */}
      <TaskTemplateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        template={editing}
      />

      {/* Delete confirmation */}
      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPendingDelete(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Delete template"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-base font-semibold text-on-surface">Delete template?</h3>
            <p className="mt-1.5 text-sm text-grey-500">
              &ldquo;{pendingDelete.name}&rdquo; will be permanently removed. This cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-xl border border-grey-300 px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="rounded-xl bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
