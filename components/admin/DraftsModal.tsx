"use client";

import { Trash2, FileText, UserRound, PencilLine } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useDrafts, useDeleteDraft } from "@/features/workforce/hooks/useDrafts";
import { WORK_TYPE_LABELS, type WorkType } from "@/features/workforce/schemas/assignment.schema";
import type { AssignmentDraft } from "@/features/workforce/schemas/draft.schema";

interface DraftsModalProps {
  open: boolean;
  onClose: () => void;
  onLoad: (draft: AssignmentDraft) => void;
}

const WORK_TYPE_HEX: Record<WorkType, string> = {
  GENERAL_TASK: "#0B585A",
  PERIODICAL_TASK: "#A855F7",
  WORK_ORDER: "#F97316",
  OTHER: "#3B82F6",
};

function formatWhen(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Short relative time ("just now", "5m ago", "3h ago", "2d ago"). */
function relativeWhen(iso?: string | null): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const diffMin = Math.round((Date.now() - then) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.round(diffH / 24);
  return `${diffD}d ago`;
}

function initialsOf(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1]![0] : "";
  return (a + b).toUpperCase() || "?";
}

interface PayloadSummary {
  workType?: WorkType;
  taskCount: number;
}

function summarize(payload: unknown): PayloadSummary {
  const obj = (payload ?? {}) as {
    workType?: string;
    groups?: Array<{ tasks?: unknown[] }>;
  };
  const taskCount = (obj.groups ?? []).reduce((sum, g) => sum + (g.tasks?.length ?? 0), 0);
  const workType =
    obj.workType && obj.workType in WORK_TYPE_LABELS ? (obj.workType as WorkType) : undefined;
  return { workType, taskCount };
}

export function DraftsModal({ open, onClose, onLoad }: DraftsModalProps) {
  const draftsQuery = useDrafts();
  const deleteMutation = useDeleteDraft();

  const drafts = draftsQuery.data ?? [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Saved drafts"
      description="Unfinished assignments you can reload and complete."
    >
      {draftsQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size={28} />
        </div>
      ) : draftsQuery.isError ? (
        <p className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
          {getErrorMessage(draftsQuery.error)}
        </p>
      ) : drafts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-grey-100 text-grey-400">
            <FileText size={22} aria-hidden="true" />
          </span>
          <p className="text-sm font-medium text-on-surface">No drafts yet</p>
          <p className="max-w-xs text-xs text-grey-500">
            Start a new assignment and choose “Save as draft” to keep it here and finish later.
          </p>
        </div>
      ) : (
        <ul className="-mx-1 flex max-h-[62vh] flex-col gap-2.5 overflow-y-auto px-1 py-0.5">
          {drafts.map((draft) => (
            <DraftRow
              key={draft.id}
              draft={draft}
              onLoad={() => onLoad(draft)}
              onDelete={() => deleteMutation.mutate(draft.id)}
              deleting={deleteMutation.isPending && deleteMutation.variables === draft.id}
            />
          ))}
        </ul>
      )}
    </Modal>
  );
}

interface DraftRowProps {
  draft: AssignmentDraft;
  onLoad: () => void;
  onDelete: () => void;
  deleting: boolean;
}

function DraftRow({ draft, onLoad, onDelete, deleting }: DraftRowProps) {
  const { workType, taskCount } = summarize(draft.payload);
  const typeHex = workType ? WORK_TYPE_HEX[workType] : "#64748B";
  const typeLabel = workType ? WORK_TYPE_LABELS[workType] : "Draft";
  const heading = draft.siteName ?? "No site selected";

  return (
    <li className="rounded-2xl border border-grey-200 bg-white p-4 transition-all hover:border-primary/40 hover:shadow-sm">
      {/* Header: type badge + site, then actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${typeHex}1a`, color: typeHex }}
          >
            <FileText size={16} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-on-surface" title={heading}>
              {heading}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{ backgroundColor: `${typeHex}1a`, color: typeHex }}
              >
                {typeLabel}
              </span>
              <span className="rounded-full bg-grey-100 px-2 py-0.5 text-[11px] font-medium text-grey-600">
                {taskCount} task{taskCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onLoad}
            className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          >
            Load
          </button>
          <button
            type="button"
            aria-label="Delete draft"
            onClick={onDelete}
            disabled={deleting}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-400 transition-colors hover:bg-red-50 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Audit meta — two tidy blocks, no awkward wrapping */}
      <div className="mt-3 grid grid-cols-1 gap-2 border-t border-grey-100 pt-3 sm:grid-cols-2">
        <MetaPerson
          icon={<UserRound size={12} aria-hidden="true" />}
          label="Created"
          name={draft.createdByName}
          absolute={formatWhen(draft.createdAt)}
          relative={relativeWhen(draft.createdAt)}
        />
        <MetaPerson
          icon={<PencilLine size={12} aria-hidden="true" />}
          label="Last updated"
          name={draft.updatedByName}
          absolute={formatWhen(draft.updatedAt)}
          relative={relativeWhen(draft.updatedAt)}
        />
      </div>
    </li>
  );
}

interface MetaPersonProps {
  icon: React.ReactNode;
  label: string;
  name?: string | null;
  absolute: string;
  relative: string | null;
}

function MetaPerson({ icon, label, name, absolute, relative }: MetaPersonProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
        {initialsOf(name)}
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-grey-400">
          {icon}
          {label}
        </p>
        <p className="truncate text-xs font-medium text-on-surface" title={name ?? undefined}>
          {name ?? "Unknown"}
        </p>
        <p className="truncate text-[11px] text-grey-500" title={absolute}>
          {relative ? `${relative} · ${absolute}` : absolute}
        </p>
      </div>
    </div>
  );
}
