"use client";

import { useMemo, useState } from "react";
import { Plus, Eye, Pencil, Trash2, Users, UserCog, UserPlus } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/shared/SearchInput";
import { RowMenu } from "@/features/user-management/components/RowMenu";
import { ConfirmDialog } from "@/features/user-management/components/ConfirmDialog";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { CreateUserModal } from "@/features/users/components/CreateUserModal";
import type { Role } from "@/features/users/schemas/user.schema";
import {
  useOutsourceProjects,
  useDeleteOutsourceProject,
} from "@/features/outsource/hooks/useOutsourceProjects";
import {
  OUTSOURCE_SCOPE_LABELS,
  type OutsourceProject,
} from "@/features/outsource/schemas/outsourceProject.schema";
import { OutsourceProjectModal } from "./OutsourceProjectModal";
import { OutsourceProfilesModal } from "./OutsourceProfilesModal";
import { OutsourceProjectDetailModal } from "./OutsourceProjectDetailModal";

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
}

export function OutsourceManagement() {
  const projectsQuery = useOutsourceProjects();
  const deleteProject = useDeleteOutsourceProject();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [staffRole, setStaffRole] = useState<Role | null>(null);
  const [editProject, setEditProject] = useState<OutsourceProject | null>(null);
  const [viewProject, setViewProject] = useState<OutsourceProject | null>(null);
  const [pendingDelete, setPendingDelete] = useState<OutsourceProject | null>(null);
  const [banner, setBanner] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [manage, setManage] = useState<{ project: OutsourceProject; kind: "cleaner" | "supervisor" } | null>(null);

  const projects = useMemo(() => {
    const list = projectsQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) =>
      [p.companyName, p.contactPersonName, p.siteName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [projectsQuery.data, search]);

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
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search outsource projects…"
          className="w-full sm:max-w-xs"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setStaffRole("OUTSOURCE_CLEANER")}
            className="inline-flex items-center gap-2 rounded-full border border-grey-300 px-4 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100"
          >
            <UserPlus size={16} aria-hidden="true" />
            Add outsource cleaner
          </button>
          <button
            type="button"
            onClick={() => setStaffRole("OUTSOURCE_SUPERVISOR")}
            className="inline-flex items-center gap-2 rounded-full border border-grey-300 px-4 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100"
          >
            <UserPlus size={16} aria-hidden="true" />
            Add outsource supervisor
          </button>
          <button
            type="button"
            onClick={() => {
              setBanner(null);
              setCreateOpen(true);
            }}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
          >
            <Plus size={18} aria-hidden="true" />
            New outsource project
          </button>
        </div>
      </div>

      {banner && (
        <p
          role="status"
          className={`mb-4 rounded-lg px-3 py-2 text-sm font-medium ${
            banner.kind === "success" ? "bg-success/10 text-success" : "bg-error/10 text-error"
          }`}
        >
          {banner.text}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
        {projectsQuery.isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : projectsQuery.isError ? (
          <div className="p-6 text-sm font-medium text-error">
            {getErrorMessage(projectsQuery.error)}
          </div>
        ) : projects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-grey-300 text-xs uppercase tracking-wide text-grey-500">
                  <th className="px-5 py-3 font-medium">Company</th>
                  <th className="px-5 py-3 font-medium">Site</th>
                  <th className="px-5 py-3 font-medium">Scope</th>
                  <th className="px-5 py-3 font-medium">Period</th>
                  <th className="px-5 py-3 font-medium">Cleaners</th>
                  <th className="px-5 py-3 font-medium">Supervisors</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id} className="border-b border-grey-100 last:border-0">
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-medium text-on-surface">{p.companyName}</span>
                        {p.contactPersonName && (
                          <span className="text-xs text-grey-500">{p.contactPersonName}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-grey-700">{p.siteName ?? "—"}</td>
                    <td className="px-5 py-3.5 text-grey-700">
                      {OUTSOURCE_SCOPE_LABELS[p.scopeType]}
                    </td>
                    <td className="px-5 py-3.5 text-grey-700">
                      {formatDate(p.startDate)} → {formatDate(p.endDate)}
                    </td>
                    <td className="px-5 py-3.5 text-grey-700">
                      {p.cleanerProfiles.filter((s) => s.cleanerId).length}/{p.numberOfOutsourceCleaners}
                    </td>
                    <td className="px-5 py-3.5 text-grey-700">
                      {p.supervisorProfiles.filter((s) => s.supervisorId).length}/{p.numberOfOutsourceSupervisors}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end">
                        <RowMenu
                          label={`Actions for ${p.companyName}`}
                          items={[
                            { label: "View details", icon: Eye, onClick: () => setViewProject(p) },
                            {
                              label: "Edit project",
                              icon: Pencil,
                              onClick: () => {
                                setBanner(null);
                                setEditProject(p);
                              },
                            },
                            {
                              label: "Assign cleaners",
                              icon: Users,
                              onClick: () => setManage({ project: p, kind: "cleaner" }),
                            },
                            {
                              label: "Assign supervisors",
                              icon: UserCog,
                              onClick: () => setManage({ project: p, kind: "supervisor" }),
                            },
                            {
                              label: "Remove",
                              icon: Trash2,
                              destructive: true,
                              onClick: () => setPendingDelete(p),
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No outsource projects yet"
            description="Create one to hand off cleaning work to an external provider."
          />
        )}
      </div>

      <OutsourceProjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(name) =>
          setBanner({
            kind: "success",
            text: `Outsource project for ${name} created. Assign outsource cleaners and supervisors to its slots.`,
          })
        }
      />

      {staffRole && (
        <CreateUserModal
          open={!!staffRole}
          onClose={() => setStaffRole(null)}
          fixedRole={staffRole}
        />
      )}

      <OutsourceProjectModal
        key={editProject?.id ?? "edit"}
        open={!!editProject}
        project={editProject}
        onClose={() => setEditProject(null)}
        onUpdated={(name) => setBanner({ kind: "success", text: `${name} updated.` })}
      />

      <OutsourceProjectDetailModal
        open={!!viewProject}
        onClose={() => setViewProject(null)}
        project={viewProject}
      />

      <OutsourceProfilesModal
        open={!!manage}
        onClose={() => setManage(null)}
        project={manage?.project ?? null}
        kind={manage?.kind ?? "cleaner"}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Remove outsource project"
        description={
          pendingDelete
            ? `Remove "${pendingDelete.companyName}"? Its outsource cleaners and supervisors will be detached from all covered tasks.`
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
    </>
  );
}
