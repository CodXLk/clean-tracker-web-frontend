"use client";

import { useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useTaskTemplates } from "@/features/workforce/hooks/useTaskTemplates";

export interface CleaningTemplateRow {
  templateId: string;
  profileIndexes: number[];
}

interface CleaningTemplatesSectionProps {
  value: CleaningTemplateRow[];
  onChange: (next: CleaningTemplateRow[]) => void;
  numberOfCleaners: number;
  error?: string;
}

/**
 * Maps saved task templates onto a (hotel) site's cleaning schedule and records which
 * cleaner slot(s) are responsible for each. Used inside the Site create/edit form; a client
 * later "checks in" one of these templates to generate a one-time assignment for that day.
 */
export function CleaningTemplatesSection({
  value,
  onChange,
  numberOfCleaners,
  error,
}: CleaningTemplatesSectionProps) {
  const templatesQuery = useTaskTemplates();
  const templates = templatesQuery.data ?? [];

  const slots = useMemo(
    () => Array.from({ length: Math.max(0, numberOfCleaners) }, (_, i) => i + 1),
    [numberOfCleaners],
  );

  const usedTemplateIds = useMemo(
    () => new Set(value.map((r) => r.templateId).filter(Boolean)),
    [value],
  );

  function addRow() {
    onChange([...value, { templateId: "", profileIndexes: [] }]);
  }

  function removeRow(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function setTemplate(index: number, templateId: string) {
    onChange(value.map((row, i) => (i === index ? { ...row, templateId } : row)));
  }

  function toggleSlot(index: number, slot: number) {
    onChange(
      value.map((row, i) => {
        if (i !== index) return row;
        const has = row.profileIndexes.includes(slot);
        return {
          ...row,
          profileIndexes: has
            ? row.profileIndexes.filter((s) => s !== slot)
            : [...row.profileIndexes, slot].sort((a, b) => a - b),
        };
      }),
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-on-surface">Cleaning schedule templates</span>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1 rounded-full border border-grey-300 px-3 py-1 text-xs font-semibold text-on-surface transition-colors hover:bg-grey-100"
        >
          <Plus className="h-3.5 w-3.5" /> Add template
        </button>
      </div>
      <p className="text-xs text-grey-500">
        Choose saved templates available in this site&apos;s cleaning schedule and the cleaner
        slot(s) responsible for each. A client checks one in per day to generate that day&apos;s tasks.
      </p>

      {slots.length === 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Set the number of cleaners above to assign responsible slots.
        </p>
      )}

      {value.length === 0 ? (
        <p className="rounded-lg border border-dashed border-grey-300 px-3 py-4 text-center text-xs text-grey-500">
          No templates mapped yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {value.map((row, index) => (
            <div key={index} className="rounded-xl border border-grey-200 p-3">
              <div className="flex items-start gap-2">
                <select
                  value={row.templateId}
                  onChange={(e) => setTemplate(index, e.target.value)}
                  className="h-10 flex-1 rounded-lg border border-grey-300 bg-surface px-3 text-sm text-on-surface focus:border-teal-500 focus:outline-none"
                >
                  <option value="">Select a template…</option>
                  {templates.map((t) => (
                    <option
                      key={t.id}
                      value={t.id}
                      disabled={t.id !== row.templateId && usedTemplateIds.has(t.id)}
                    >
                      {t.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  aria-label="Remove template"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-grey-300 text-grey-500 transition-colors hover:bg-error/10 hover:text-error"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {slots.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {slots.map((slot) => {
                    const active = row.profileIndexes.includes(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => toggleSlot(index, slot)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                          active
                            ? "border-teal-500 bg-teal-500 text-white"
                            : "border-grey-300 text-on-surface hover:bg-grey-100"
                        }`}
                      >
                        Cleaner {slot}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs font-medium text-error">{error}</p>}
    </div>
  );
}
