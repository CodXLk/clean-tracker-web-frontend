"use client";

import { useMemo, useState } from "react";
import { ListChecks, Plus, Pencil, Trash2, Clock, Eye } from "lucide-react";
import { useTaskTemplates, useDeleteTaskTemplate } from "@/features/workforce/hooks/useTaskTemplates";
import { TaskTemplateModal } from "@/features/workforce/components/TaskTemplateModal";
import { Modal } from "@/components/shared/Modal";
import { SearchInput } from "@/components/shared/SearchInput";
import type { TaskTemplate } from "@/features/workforce/schemas/taskTemplate.schema";

function totalDuration(template: TaskTemplate): number {
  return template.tasks.reduce((sum, t) => sum + (t.durationMinutes ?? 0), 0);
}

type TemplateDetail = { kind: "new" } | { kind: "edit"; template: TaskTemplate };

export function TaskTemplatesTab() {
  const templatesQuery = useTaskTemplates();
  const deleteMutation = useDeleteTaskTemplate();

  const [detail, setDetail] = useState<TemplateDetail | null>(null);
  const [viewing, setViewing] = useState<TaskTemplate | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TaskTemplate | null>(null);
  const [search, setSearch] = useState("");

  const templates = useMemo(() => {
    const list = templatesQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.tasks.some((task) => task.name.toLowerCase().includes(q)),
    );
  }, [templatesQuery.data, search]);

  function openNew() {
    setDetail({ kind: "new" });
  }

  function openEdit(template: TaskTemplate) {
    setDetail({ kind: "edit", template });
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
      {detail ? (
        <TaskTemplateModal
          embedded
          open
          onClose={() => setDetail(null)}
          template={detail.kind === "edit" ? detail.template : null}
        />
      ) : (
      <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search templates…"
          className="w-full sm:max-w-xs"
        />
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
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-ink">
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
        <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-grey-300 text-xs uppercase tracking-wide text-grey-500">
                  <th className="px-5 py-3 font-medium">Template</th>
                  <th className="px-5 py-3 font-medium">Tasks</th>
                  <th className="px-5 py-3 font-medium">Duration</th>
                  <th className="px-5 py-3 font-medium">Updated by</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => {
                  const mins = totalDuration(template);
                  return (
                    <tr key={template.id} className="border-b border-grey-100 last:border-0">
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-medium text-on-surface">{template.name}</span>
                          {template.tasks.length > 0 && (
                            <span className="max-w-md truncate text-xs text-grey-500">
                              {template.tasks.slice(0, 3).map((t) => t.name).join(", ")}
                              {template.tasks.length > 3 ? ` +${template.tasks.length - 3} more` : ""}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-grey-700">
                        {template.tasks.length} {template.tasks.length === 1 ? "task" : "tasks"}
                      </td>
                      <td className="px-5 py-3.5 text-grey-700">
                        {mins > 0 ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock size={13} aria-hidden="true" />
                            {mins} min
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-grey-700">{template.updatedByName ?? "—"}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            aria-label="View template"
                            onClick={() => setViewing(template)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-primary/10 hover:text-ink"
                          >
                            <Eye size={15} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            aria-label="Edit template"
                            onClick={() => openEdit(template)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-primary/10 hover:text-ink"
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </>
      )}

      {viewing && (
        <TemplateViewModal
          template={viewing}
          onEdit={() => {
            const current = viewing;
            setViewing(null);
            openEdit(current);
          }}
          onClose={() => setViewing(null)}
        />
      )}

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

interface TemplateViewModalProps {
  template: TaskTemplate;
  onEdit: () => void;
  onClose: () => void;
}

function TemplateViewModal({ template, onEdit, onClose }: TemplateViewModalProps) {
  const mins = totalDuration(template);
  return (
    <Modal
      open
      onClose={onClose}
      title={template.name}
      description={`${template.tasks.length} ${template.tasks.length === 1 ? "task" : "tasks"}${mins > 0 ? ` · ${mins} min total` : ""}`}
      maxWidthClassName="max-w-lg"
    >
      <div className="flex flex-col gap-4">
        {template.tasks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-grey-200 px-3 py-8 text-center text-sm text-grey-500">
            This template has no tasks yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {template.tasks.map((task, i) => (
              <li key={`${task.name}-${i}`} className="rounded-xl border border-grey-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-on-surface">{task.name}</p>
                    {task.description && <p className="mt-0.5 text-xs text-grey-500">{task.description}</p>}
                  </div>
                  {task.durationMinutes != null && task.durationMinutes > 0 && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-grey-100 px-2.5 py-0.5 text-xs font-medium text-grey-600">
                      <Clock size={12} aria-hidden="true" /> {task.durationMinutes} min
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end gap-2 border-t border-grey-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-grey-300 px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-variant"
          >
            <Pencil size={15} aria-hidden="true" /> Edit template
          </button>
        </div>
      </div>
    </Modal>
  );
}
