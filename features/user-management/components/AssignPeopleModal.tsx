"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Modal } from "@/components/shared/Modal";
import { PillButton } from "@/components/shared/PillButton";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export interface AssignOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface AssignPeopleModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  options: AssignOption[];
  initialSelectedIds: string[];
  isLoading?: boolean;
  isSaving?: boolean;
  error?: string;
  emptyMessage?: string;
  onSave: (ids: string[]) => void;
}

export function AssignPeopleModal({
  open,
  onClose,
  title,
  description,
  options,
  initialSelectedIds,
  isLoading,
  isSaving,
  error,
  emptyMessage = "No one available to assign.",
  onSave,
}: AssignPeopleModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  // Sync the checked set from the loaded current assignments (render-time sync,
  // re-runs when the current-assignment data arrives while the modal is open).
  const initialKey = useMemo(() => [...initialSelectedIds].sort().join(","), [initialSelectedIds]);
  const [syncedKey, setSyncedKey] = useState<string | null>(null);
  if (open && !isLoading && initialKey !== syncedKey) {
    setSyncedKey(initialKey);
    setSelected(new Set(initialSelectedIds));
  }
  if (!open && syncedKey !== null) {
    setSyncedKey(null);
    setSearch("");
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || (o.sublabel ?? "").toLowerCase().includes(q),
    );
  }, [options, search]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((o) => selected.has(o.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      const ids = filtered.map((o) => o.id);
      if (ids.every((id) => next.has(id))) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Search + count */}
          <div className="flex items-center gap-3">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-grey-300 px-3 py-2">
              <Search size={15} className="text-grey-500" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-sm text-on-surface outline-none placeholder:text-grey-500"
                aria-label="Search"
              />
            </div>
            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {selected.size} selected
            </span>
          </div>

          {options.length === 0 ? (
            <p className="py-8 text-center text-sm text-grey-500">{emptyMessage}</p>
          ) : (
            <>
              {filtered.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  className="flex items-center gap-2 self-start text-xs font-medium text-grey-500 hover:text-on-surface"
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border-2 transition-colors",
                      allFilteredSelected ? "border-primary bg-primary text-white" : "border-grey-300 bg-white",
                    )}
                  >
                    {allFilteredSelected && <Check size={10} aria-hidden="true" />}
                  </span>
                  Select all
                </button>
              )}

              <div className="max-h-[46vh] overflow-y-auto rounded-xl border border-grey-200">
                {filtered.length === 0 ? (
                  <p className="py-8 text-center text-sm text-grey-500">No results match your search.</p>
                ) : (
                  <ul className="divide-y divide-grey-100">
                    {filtered.map((o) => {
                      const isSelected = selected.has(o.id);
                      return (
                        <li key={o.id}>
                          <button
                            type="button"
                            onClick={() => toggle(o.id)}
                            aria-pressed={isSelected}
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-grey-50 focus-visible:outline-none focus-visible:bg-grey-50"
                          >
                            <span
                              className={cn(
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                                isSelected ? "border-primary bg-primary text-white" : "border-grey-300 bg-white",
                              )}
                            >
                              {isSelected && <Check size={12} aria-hidden="true" />}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium text-on-surface">{o.label}</span>
                              {o.sublabel && (
                                <span className="block truncate text-xs text-grey-500">{o.sublabel}</span>
                              )}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </>
          )}

          {error && <p className="text-sm text-error">{error}</p>}

          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-full border border-grey-300 px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100 disabled:opacity-60"
            >
              Cancel
            </button>
            <PillButton
              type="button"
              variant="teal"
              onClick={() => onSave([...selected])}
              disabled={isSaving}
              className="w-auto px-6"
            >
              {isSaving ? "Saving…" : "Save"}
            </PillButton>
          </div>
        </div>
      )}
    </Modal>
  );
}
