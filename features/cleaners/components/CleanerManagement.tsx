"use client";

import { useMemo, useState } from "react";
import { UserPlus, Eye, Pencil, RefreshCw, Ban } from "lucide-react";
import { useUsers } from "@/features/users/hooks/useUsers";
import { useMe } from "@/features/auth/hooks/useMe";
import { useDeactivateUser, useResendSetup } from "@/features/users/hooks/useUserActions";
import { CreateUserModal } from "@/features/users/components/CreateUserModal";
import { UserDetailModal } from "@/features/users/components/UserDetailModal";
import { EditUserModal } from "@/features/users/components/EditUserModal";
import { RowMenu } from "@/features/user-management/components/RowMenu";
import type { User } from "@/features/users/schemas/user.schema";
import { canManageCleaners } from "@/features/users/lib/permissions";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/shared/SearchInput";

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

export function CleanerManagement() {
  const [modalOpen, setModalOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const me = useMe();
  const usersQuery = useUsers();
  const deactivate = useDeactivateUser();
  const resend = useResendSetup();

  const canManage = canManageCleaners(me.data?.role);
  const cleaners = useMemo(() => {
    const list = usersQuery.data?.filter((u) => u.role === "CLEANER") ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((u) =>
      [u.firstName, u.lastName, u.email, u.phoneNumber]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [usersQuery.data, search]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search cleaners…"
          className="w-full sm:max-w-xs"
        />
        {canManage && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
          >
            <UserPlus size={18} aria-hidden="true" />
            Add cleaner
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
        {usersQuery.isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : usersQuery.isError ? (
          <div className="p-6 text-sm font-medium text-error">Failed to load cleaners.</div>
        ) : cleaners && cleaners.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-grey-300 text-xs uppercase tracking-wide text-grey-500">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Phone</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cleaners.map((user) => (
                  <tr key={user.id} className="border-b border-grey-100 last:border-0">
                    <td className="px-5 py-3.5 font-medium text-on-surface">
                      {[user.firstName, user.lastName].filter(Boolean).join(" ")}
                    </td>
                    <td className="px-5 py-3.5 text-grey-700">{user.email}</td>
                    <td className="px-5 py-3.5 text-grey-700">{user.phoneNumber ?? "—"}</td>
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
                            ...(user.active
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
          <EmptyState title="No cleaners yet" description="Add your first cleaner to get started." />
        )}
      </div>

      {canManage && (
        <CreateUserModal open={modalOpen} onClose={() => setModalOpen(false)} fixedRole="CLEANER" />
      )}

      <UserDetailModal open={detailUser !== null} onClose={() => setDetailUser(null)} user={detailUser} />
      <EditUserModal open={editUser !== null} onClose={() => setEditUser(null)} user={editUser} />
    </>
  );
}
