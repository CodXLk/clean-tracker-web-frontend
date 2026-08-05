"use client";

import { useEffect, useState } from "react";
import { X, Plus, Trash2, ListChecks } from "lucide-react";
import { SearchableSelect, type SelectOption } from "@/features/user-management/components/SearchableSelect";
import { useSaveTaskTemplate } from "@/features/workforce/hooks/useTaskTemplates";
import { useInventoryItems } from "@/features/inventory/hooks/useInventory";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import type { TaskTemplate } from "@/features/workforce/schemas/taskTemplate.schema";

interface EditableItem {
  itemId: string;
  quantity: number;
}

interface EditableTask {
  name: string;
  duration: string;
  description: string;
  items: EditableItem[];
}

interface TaskTemplateModalProps {
  open: boolean;
  onClose: () => void;
  template?: TaskTemplate | null;
}

function blankTask(): EditableTask {
  return { name: "", duration: "", description: "", items: [] };
}

function toEditableTasks(template?: TaskTemplate | null): EditableTask[] {
  if (!template || template.tasks.length === 0) return [blankTask()];
  return template.tasks.map((t) => ({
    name: t.name,
    duration: t.durationMinutes != null && t.durationMinutes > 0 ? String(t.durationMinutes) : "",
    description: t.description ?? "",
    items: (t.items ?? []).map((it) => ({ itemId: it.itemId, quantity: it.quantity })),
  }));
}

export function TaskTemplateModal({ open, onClose, template }: TaskTemplateModalProps) {
  const isEdit = Boolean(template?.id);
  const saveMutation = useSaveTaskTemplate();
  const itemsQuery = useInventoryItems(true);

  const [name, setName] = useState("");
  const [tasks, setTasks] = useState<EditableTask[]>([blankTask()]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(template?.name ?? "");
    setTasks(toEditableTasks(template));
    setError(null);
  }, [open, template]);

  const catalog = itemsQuery.data ?? [];
  const itemById = (id: string) => catalog.find((it) => it.id === id);

  function updateTask(index: number, patch: Partial<EditableTask>) {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function addTask() {
    setTasks((prev) => [...prev, blankTask()]);
  }

  function removeTask(index: number) {
    setTasks((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function addItem(taskIndex: number, itemId: string, quantity: number) {
    setTasks((prev) =>
      prev.map((t, i) =>
        i === taskIndex ? { ...t, items: [...t.items, { itemId, quantity }] } : t,
      ),
    );
  }

  function removeItem(taskIndex: number, itemIndex: number) {
    setTasks((prev) =>
      prev.map((t, i) =>
        i === taskIndex ? { ...t, items: t.items.filter((_, j) => j !== itemIndex) } : t,
      ),
    );
  }

  async function handleSave() {
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Template name is required.");
      return;
    }
    const cleanedTasks = tasks
      .filter((t) => t.name.trim())
      .map((t) => {
        const duration = parseInt(t.duration, 10);
        return {
          name: t.name.trim(),
          ...(Number.isFinite(duration) && duration > 0 ? { durationMinutes: duration } : {}),
          ...(t.description.trim() ? { description: t.description.trim() } : {}),
          items: t.items.map((it) => ({ itemId: it.itemId, quantity: it.quantity })),
        };
      });
    if (cleanedTasks.length === 0) {
      setError("Add at least one task with a name.");
      return;
    }
    try {
      await saveMutation.mutateAsync({
        id: template?.id,
        input: { name: trimmedName, tasks: cleanedTasks },
      });
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Edit task list template" : "New task list template"}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-grey-200 p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ListChecks size={20} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-on-surface">
                {isEdit ? "Edit Task List Template" : "New Task List Template"}
              </h2>
              <p className="mt-0.5 text-sm text-grey-500">
                A reusable list of tasks with optional expected inventory items.
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-grey-500 hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-danger/30 bg-red-50 px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="mb-5 flex flex-col gap-1.5">
            <label htmlFor="template-name" className="text-sm font-medium text-on-surface">
              Template name <span className="text-danger">*</span>
            </label>
            <input
              id="template-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Standard room turnover"
              className="rounded-xl border border-grey-300 px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-on-surface">Tasks</h3>
            <span className="text-xs text-grey-500">{tasks.length} in list</span>
          </div>

          <div className="flex flex-col gap-3">
            {tasks.map((task, index) => (
              <div key={index} className="rounded-xl border border-grey-200 bg-grey-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        value={task.name}
                        onChange={(e) => updateTask(index, { name: e.target.value })}
                        placeholder="Task name"
                        className="min-w-0 flex-1 rounded-lg border border-grey-300 bg-white px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          value={task.duration}
                          onChange={(e) => updateTask(index, { duration: e.target.value })}
                          placeholder="Mins"
                          className="w-24 rounded-lg border border-grey-300 bg-white px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                        <span className="text-xs text-grey-500">min</span>
                      </div>
                    </div>

                    <textarea
                      value={task.description}
                      onChange={(e) => updateTask(index, { description: e.target.value })}
                      placeholder="Description (optional)"
                      rows={2}
                      className="mt-2 w-full resize-none rounded-lg border border-grey-300 bg-white px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />

                    <TemplateItemsEditor
                      items={task.items}
                      options={catalog
                        .filter((it) => !task.items.some((chosen) => chosen.itemId === it.id))
                        .map((it) => ({ value: it.id, label: `${it.name} (${it.unit})` }))}
                      loading={itemsQuery.isLoading}
                      labelFor={(id) => {
                        const it = itemById(id);
                        return { name: it?.name ?? "Item", unit: it?.unit ?? "" };
                      }}
                      onAdd={(itemId, quantity) => addItem(index, itemId, quantity)}
                      onRemove={(itemIndex) => removeItem(index, itemIndex)}
                    />
                  </div>
                  <button
                    type="button"
                    aria-label="Remove task"
                    onClick={() => removeTask(index)}
                    disabled={tasks.length === 1}
                    className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-red-50 hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addTask}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-grey-300 px-3 py-2 text-sm font-medium text-grey-600 transition-colors hover:border-primary hover:text-primary"
          >
            <Plus size={16} aria-hidden="true" />
            Add task
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-grey-200 p-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-grey-300 px-5 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-variant disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saveMutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create template"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Items editor ────────────────────────────────────────────────────────────────

interface TemplateItemsEditorProps {
  items: EditableItem[];
  options: SelectOption[];
  loading: boolean;
  labelFor: (id: string) => { name: string; unit: string };
  onAdd: (itemId: string, quantity: number) => void;
  onRemove: (itemIndex: number) => void;
}

function TemplateItemsEditor({
  items,
  options,
  loading,
  labelFor,
  onAdd,
  onRemove,
}: TemplateItemsEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const [selItem, setSelItem] = useState<string | null>(null);
  const [qty, setQty] = useState("1");

  const showList = items.length > 0;
  const isOpen = expanded || showList;

  function handleAdd() {
    if (!selItem) return;
    const q = parseFloat(qty);
    if (!Number.isFinite(q) || q <= 0) return;
    onAdd(selItem, q);
    setSelItem(null);
    setQty("1");
  }

  if (!isOpen) {
    return (
      <div className="mt-2">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="inline-flex items-center gap-1 rounded-lg border border-dashed border-grey-300 px-2.5 py-1 text-[11px] font-medium text-grey-600 transition-colors hover:border-primary hover:text-primary"
        >
          <Plus size={12} aria-hidden="true" />
          Add items
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <p className="mb-1.5 text-[11px] font-medium text-grey-500">Expected items (optional)</p>

      {showList && (
        <ul className="mb-2 flex flex-col gap-1">
          {items.map((it, i) => {
            const label = labelFor(it.itemId);
            return (
              <li
                key={`${it.itemId}_${i}`}
                className="flex items-center gap-2 rounded-lg border border-grey-200 bg-white px-2.5 py-1.5 text-[11px]"
              >
                <span className="min-w-0 flex-1 truncate text-on-surface">{label.name}</span>
                <span className="shrink-0 rounded-md bg-grey-100 px-1.5 py-0.5 font-medium text-grey-600">
                  {it.quantity} {label.unit}
                </span>
                <button
                  type="button"
                  aria-label="Remove item"
                  onClick={() => onRemove(i)}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-red-50 hover:text-danger"
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <SearchableSelect
            label="Item"
            options={options}
            value={selItem}
            onChange={setSelItem}
            loading={loading}
            placeholder="Select an item"
            emptyMessage="No items available"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-on-surface">Quantity</label>
          <div className="flex items-stretch gap-1.5">
            <input
              type="number"
              min="0.001"
              step="any"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-24 rounded-lg border border-grey-300 px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={handleAdd}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-variant"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
