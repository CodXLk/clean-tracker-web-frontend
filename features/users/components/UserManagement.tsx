"use client";

import { useMemo, useState } from "react";
import { UserPlus, RefreshCw, Ban } from "lucide-react";
import { useUsers } from "@/features/users/hooks/useUsers";
import { useMe } from "@/features/auth/hooks/useMe";
import { useDeactivateUser, useResendSetup } from "@/features/users/hooks/useUserActions";
import { CreateUserModal } from "./CreateUserModal";
import { ROLE_LABELS, type User } from "@/features/users/schemas/user.schema";
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

export function UserManagement() {
  const [modalOpen, setModalOpen] = useState(false);
  const me = useMe();
  const usersQuery = useUsers();
  const deactivate = useDeactivateUser();
  const resend = useResendSetup();

  const allowedRoles = useMemo(() => creatableRoles(me.data?.role), [me.data?.role]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-on-surface">Users</h1>
            <p className="mt-1 text-sm text-grey-500">Manage staff, client service managers and client contacts</p>
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

        <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
          {usersQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : usersQuery.isError ? (
            <div className="p-6 text-sm font-medium text-error">Failed to load users.</div>
          ) : usersQuery.data && usersQuery.data.length > 0 ? (
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
                  {usersQuery.data.map((user) => (
                    <tr key={user.id} className="border-b border-grey-100 last:border-0">
                      <td className="px-5 py-3.5 font-medium text-on-surface">
                        {[user.firstName, user.lastName].filter(Boolean).join(" ")}
                        {me.data?.id === user.id && (
                          <span className="ml-2 text-xs font-normal text-grey-500">(you)</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-grey-700">{user.email}</td>
                      <td className="px-5 py-3.5 text-grey-700">{ROLE_LABELS[user.role]}</td>
                      <td className="px-5 py-3.5">
                        <StatusPill user={user} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-2">
                          {!user.setupComplete && user.active && (
                            <button
                              type="button"
                              onClick={() => resend.mutate(user.id)}
                              disabled={resend.isPending}
                              title="Resend setup email"
                              className="flex items-center gap-1 rounded-lg border border-grey-300 px-2.5 py-1.5 text-xs font-medium text-on-surface hover:bg-grey-100 disabled:opacity-50"
                            >
                              <RefreshCw size={14} aria-hidden="true" /> Resend
                            </button>
                          )}
                          {user.active && me.data?.id !== user.id && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Deactivate ${user.email}?`)) deactivate.mutate(user.id);
                              }}
                              disabled={deactivate.isPending}
                              title="Deactivate user"
                              className="flex items-center gap-1 rounded-lg border border-error/30 px-2.5 py-1.5 text-xs font-medium text-error hover:bg-error/10 disabled:opacity-50"
                            >
                              <Ban size={14} aria-hidden="true" /> Deactivate
                            </button>
                          )}
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
        <CreateUserModal open={modalOpen} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
