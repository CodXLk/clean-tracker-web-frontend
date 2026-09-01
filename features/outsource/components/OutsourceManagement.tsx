"use client";

import { useState } from "react";
import { Handshake, Plus, Trash2, Building2, CalendarRange, Mail } from "lucide-react";
import { PillButton } from "@/components/shared/PillButton";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ConfirmDialog } from "@/features/user-management/components/ConfirmDialog";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import {
  useOutsourceProjects,
  useDeleteOutsourceProject,
} from "@/features/outsource/hooks/useOutsourceProjects";
import {
  OUTSOURCE_SCOPE_LABELS,
  type OutsourceProject,
} from "@/features/outsource/schemas/outsourceProject.schema";
import { OutsourceProjectModal } from "./OutsourceProjectModal";

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
}

export function OutsourceManagement() {
  const projectsQuery = useOutsourceProjects();
  const deleteProject = useDeleteOutsourceProject();

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<OutsourceProject | null>(null);
  const [banner, setBanner] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const projects = projectsQuery.data ?? [];

  function confirmDelete() {
    if (!pendingDelete) return;
    deleteProject.mutate(pendingDelete.id, {
      onSuccess: () => {
        setBanner({ kind: "success", text: `${pendingDelete.companyName} removed.` });
        setPendingDelete(null);
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-on-surface">
            <Handshake className="h-6 w-6 text-[#ED5F25]" />
            Outsource Management
          </h1>
          <p className="text-sm text-grey-500">
            Outsource a whole site, selected floors/areas, or specific tasks. Each project creates an
            outsource cleaner and supervisor login (credentials emailed) and attaches them to the
            covered tasks.
          </p>
        </div>
        <PillButton
          type="button"
          variant="teal"
          onClick={() => {
            setBanner(null);
            setModalOpen(true);
          }}
          className="w-auto shrink-0 px-5"
        >
          <span className="inline-flex items-center gap-2">
            <Plus size={16} aria-hidden="true" />
            New outsource project
          </span>
        </PillButton>
      </header>

      {banner && (
        <p
          role="status"
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            banner.kind === "success" ? "bg-success/10 text-success" : "bg-error/10 text-error"
          }`}
        >
          {banner.text}
        </p>
      )}

      {projectsQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : projectsQuery.isError ? (
        <p className="rounded-xl bg-error/10 px-3 py-2 text-sm text-error">
          {getErrorMessage(projectsQuery.error)}
        </p>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-grey-300 p-10 text-center text-sm text-grey-500">
          No outsource projects yet. Create one to hand off cleaning work to an external provider.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {projects.map((p) => (
            <article
              key={p.id}
              className="flex flex-col gap-3 rounded-2xl border border-grey-200 bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-base font-semibold text-on-surface">{p.companyName}</span>
                  {p.contactPersonName && (
                    <span className="text-xs text-grey-500">{p.contactPersonName}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setPendingDelete(p)}
                  aria-label={`Remove ${p.companyName}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-400 transition-colors hover:bg-error/10 hover:text-error"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 font-medium text-ink">
                  <Building2 size={12} aria-hidden="true" />
                  {p.siteName ?? "Site"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-1 font-medium text-teal-700">
                  {OUTSOURCE_SCOPE_LABELS[p.scopeType]}
                </span>
                <span className="rounded-full bg-grey-100 px-2 py-1 font-medium text-grey-600">
                  {p.taskCount} task{p.taskCount === 1 ? "" : "s"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-grey-500">
                <CalendarRange size={14} aria-hidden="true" />
                {formatDate(p.startDate)} → {formatDate(p.endDate)}
              </div>

              <div className="flex flex-col gap-1 rounded-xl bg-grey-50 px-3 py-2 text-xs text-grey-600">
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={12} aria-hidden="true" />
                  Cleaner: {p.cleanerEmail ?? "—"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={12} aria-hidden="true" />
                  Supervisor: {p.supervisorEmail ?? "—"}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      <OutsourceProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(name) =>
          setBanner({
            kind: "success",
            text: `Outsource project for ${name} created. Login details were emailed to the cleaner and supervisor.`,
          })
        }
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Remove outsource project"
        description={
          pendingDelete
            ? `Remove "${pendingDelete.companyName}"? Its outsource cleaner and supervisor will be detached from all tasks and their logins deactivated.`
            : ""
        }
        confirmLabel="Remove"
        isPending={deleteProject.isPending}
        error={deleteProject.isError ? getErrorMessage(deleteProject.error) : undefined}
        onConfirm={confirmDelete}
        onClose={() => {
          if (deleteProject.isPending) return;
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
