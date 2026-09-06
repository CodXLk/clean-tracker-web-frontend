"use client";

import { useMemo, useState } from "react";
import { UserPlus, Eye, Pencil, RefreshCw, Ban } from "lucide-react";
import { useUsers } from "@/features/users/hooks/useUsers";
import { useMe } from "@/features/auth/hooks/useMe";
import { useDeactivateUser, useResendSetup } from "@/features/users/hooks/useUserActions";
import { CreateUserModal } from "./CreateUserModal";
import { UserDetailModal } from "./UserDetailModal";
import { EditUserModal } from "./EditUserModal";
import { RowMenu } from "@/features/user-management/components/RowMenu";
import { ROLES, ROLE_LABELS, ROLE_BADGE_CLASSES, type Role, type User } from "@/features/users/schemas/user.schema";
import { creatableRoles } from "@/features/users/lib/permissions";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";

function StatusPill({ user }: { user: User }) {
  if (!user.active) {
    return <span className="rounded-full bg-grey-100 px-2.5 py-0.5 text-xs font-medium text-grey-700">Inactive</span>;
  }
  if (!user.setupComplete) {
    return (
      <span className="rounded-full bg-status-pending/10 px-2.5 py-0.5 text-xs font-medium text-status-pending">
        Pending setup
      </span>
    );
  }
  return <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">Active</span>;
}

function RoleBadges({ user }: { user: User }) {
  const roles = user.roles?.length ? user.roles : [user.role];
  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.map((role) => (
        <span
          key={role}
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE_CLASSES[role]}`}
        >
          {ROLE_LABELS[role]}
        </span>
      ))}
    </div>
  );
}

// Roles shown in the Users tab and the filter — internal roles only (clients are managed
// elsewhere, and Super Admin accounts are never surfaced here).
const FILTERABLE_ROLES: Role[] = ROLES.filter((r) => r !== "CLIENT" && r !== "SUPER_ADMIN");

export function UserManagement() {
  const [modalOpen, setModalOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
  const me = useMe();
  const usersQuery = useUsers();
  const deactivate = useDeactivateUser();
  const resend = useResendSetup();

  const allowedRoles = useMemo(() => creatableRoles(me.data?.role), [me.data?.role]);
  // Show every internal user except Super Admins and clients (clients are provisioned and
  // managed via Client Management), optionally narrowed by the selected role filter.
  const users = useMemo(() => {
    const list =
      usersQuery.data?.filter((u) => {
        const roles = u.roles?.length ? u.roles : [u.role];
        return u.role !== "CLIENT" && !roles.includes("SUPER_ADMIN");
      }) ?? [];
    if (roleFilter === "ALL") return list;
    return list.filter((u) => (u.roles?.length ? u.roles : [u.role]).includes(roleFilter));
  }, [usersQuery.data, roleFilter]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-grey-500">Manage all internal staff — admins, managers, supervisors and cleaners</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="roleFilter" className="text-sm font-medium text-grey-600">
                Role
              </label>
              <select
                id="roleFilter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as Role | "ALL")}
                className="h-10 rounded-full border border-grey-300 bg-white px-4 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="ALL">All roles</option>
                {FILTERABLE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>
            {allowedRoles.length > 0 && (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
              >
                <UserPlus size={18} aria-hidden="true" />
                Invite user
              </button>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
          {usersQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : usersQuery.isError ? (
            <div className="p-6 text-sm font-medium text-error">Failed to load users.</div>
          ) : users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-grey-300 text-xs uppercase tracking-wide text-grey-500">
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-grey-100 last:border-0">
                      <td className="px-5 py-3.5 font-medium text-on-surface">
                        {[user.firstName, user.lastName].filter(Boolean).join(" ")}
                        {me.data?.id === user.id && (
                          <span className="ml-2 text-xs font-normal text-grey-500">(you)</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-grey-700">{user.email}</td>
                      <td className="px-5 py-3.5">
                        <RoleBadges user={user} />
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusPill user={user} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end">
                          <RowMenu
                            label={`Actions for ${user.email}`}
                            items={[
                              { label: "View profile", icon: Eye, onClick: () => setDetailUser(user) },
                              { label: "Edit details", icon: Pencil, onClick: () => setEditUser(user) },
                              ...(!user.setupComplete && user.active
                                ? [{ label: "Resend setup", icon: RefreshCw, onClick: () => resend.mutate(user.id) }]
                                : []),
                              ...(user.active && me.data?.id !== user.id
                                ? [{
                                    label: "Deactivate",
                                    icon: Ban,
                                    destructive: true,
                                    onClick: () => {
                                      if (confirm(`Deactivate ${user.email}?`)) deactivate.mutate(user.id);
                                    },
                                  }]
                                : []),
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
            <EmptyState title="No users yet" description="Invite your first user to get started." />
          )}
        </div>
      </div>

      {allowedRoles.length > 0 && (
        <CreateUserModal open={modalOpen} onClose={() => setModalOpen(false)} allowedRoleNames={allowedRoles} />
      )}

      <UserDetailModal open={detailUser !== null} onClose={() => setDetailUser(null)} user={detailUser} />
      <EditUserModal open={editUser !== null} onClose={() => setEditUser(null)} user={editUser} />
    </div>
  );
}
