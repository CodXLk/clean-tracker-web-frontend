"use client";

import { useMemo, useState } from "react";
import { MailPlus, Plus, Send, UserX } from "lucide-react";
import { SearchInput } from "@/components/shared/SearchInput";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { DataTable, type Column } from "./DataTable";
import { RowActions } from "./RowActions";
import { ConfirmDialog } from "./ConfirmDialog";
import { ClientFormModal } from "./ClientFormModal";
import {
  useClients,
  useDeleteClient,
  useInviteClientLogin,
  useRemoveClientLogin,
} from "@/features/user-management/hooks/useClients";
import type { Client } from "@/features/user-management/schemas/client.schema";
import { cn } from "@/lib/utils/cn";

const LOGIN_META: Record<Client["loginStatus"], { label: string; cls: string }> = {
  NONE: { label: "No login", cls: "bg-grey-100 text-grey-600" },
  INVITED: { label: "Invited", cls: "bg-amber-100 text-amber-700" },
  ACTIVE: { label: "Active", cls: "bg-emerald-100 text-emerald-700" },
  REMOVED: { label: "Removed", cls: "bg-red-100 text-red-700" },
};

export function ClientManagement() {
  const query = useClients();
  const deleteMutation = useDeleteClient();
  const inviteMutation = useInviteClientLogin();
  const removeLoginMutation = useRemoveClientLogin();
  const [removingLogin, setRemovingLogin] = useState<Client | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  function invite(c: Client) {
    setNotice(null);
    inviteMutation.mutate(c.id, {
      onSuccess: () =>
        setNotice({
          tone: "ok",
          text: `${c.loginStatus === "NONE" ? "Invitation" : "Setup link"} sent to ${c.email ?? c.name}.`,
        }),
      onError: (e) => setNotice({ tone: "error", text: getErrorMessage(e) }),
    });
  }

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState<Client | null>(null);

  const rows = useMemo(() => {
    const list = query.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.clientCompanyName.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.contactNumber ?? "").toLowerCase().includes(q),
    );
  }, [query.data, search]);

  const columns: Column<Client>[] = [
    {
      header: "Name",
      sortAccessor: (c) => c.name.toLowerCase(),
      cell: (c) => <span className="font-medium text-on-surface">{c.name}</span>,
    },
    {
      header: "Client-company",
      sortAccessor: (c) => c.clientCompanyName.toLowerCase(),
      cell: (c) => (
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-ink">
          {c.clientCompanyName}
        </span>
      ),
    },
    {
      header: "Contact number",
      sortAccessor: (c) => c.contactNumber ?? "",
      cell: (c) => c.contactNumber ?? "—",
    },
    {
      header: "Email",
      sortAccessor: (c) => c.email ?? "",
      cell: (c) => c.email ?? "—",
    },
    {
      header: "Login",
      sortAccessor: (c) => c.loginStatus,
      cell: (c) => {
        const meta = LOGIN_META[c.loginStatus];
        const canInvite = c.loginStatus !== "ACTIVE" && Boolean(c.email);
        const inviteLabel =
          c.loginStatus === "NONE" ? "Send invite" : c.loginStatus === "REMOVED" ? "Restore & invite" : "Resend setup link";
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", meta.cls)}>{meta.label}</span>
            {canInvite && (
              <button
                type="button"
                onClick={() => invite(c)}
                disabled={inviteMutation.isPending && inviteMutation.variables === c.id}
                title={inviteLabel}
                aria-label={`${inviteLabel} for ${c.name}`}
                className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-medium text-ink transition-colors hover:bg-primary/10 disabled:opacity-50"
              >
                {c.loginStatus === "NONE" ? <MailPlus size={14} aria-hidden="true" /> : <Send size={14} aria-hidden="true" />}
                <span className="hidden lg:inline">{inviteLabel}</span>
              </button>
            )}
            {(c.loginStatus === "ACTIVE" || c.loginStatus === "INVITED") && (
              <button
                type="button"
                onClick={() => setRemovingLogin(c)}
                title="Remove login"
                aria-label={`Remove login for ${c.name}`}
                className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-medium text-grey-500 transition-colors hover:bg-error/10 hover:text-error"
              >
                <UserX size={14} aria-hidden="true" />
                <span className="hidden lg:inline">Remove login</span>
              </button>
            )}
          </div>
        );
      },
    },
    {
      header: "",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (c) => (
        <RowActions
          onEdit={() => {
            setEditing(c);
            setFormOpen(true);
          }}
          onDelete={() => setDeleting(c)}
        />
      ),
    },
  ];

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function confirmDelete() {
    if (!deleting) return;
    deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search clients…" className="sm:max-w-xs" />
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
        >
          <Plus size={18} aria-hidden="true" />
          Add client
        </button>
      </div>

      {notice && (
        <p
          role="status"
          className={cn(
            "rounded-xl px-4 py-2.5 text-sm font-medium",
            notice.tone === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-error/10 text-error",
          )}
        >
          {notice.text}
        </p>
      )}

      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(c) => c.id}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage="Failed to load clients."
        emptyTitle="No clients yet"
        emptyDescription="Add your first client and assign it to a client-company."
      />

      <ClientFormModal open={formOpen} onClose={() => setFormOpen(false)} client={editing} />

      <ConfirmDialog
        open={!!removingLogin}
        title="Remove login"
        description={`Remove ${removingLogin?.name}'s portal login? They won't be able to sign in. The contact stays, and you can invite them again later.`}
        isPending={removeLoginMutation.isPending}
        error={removeLoginMutation.isError ? getErrorMessage(removeLoginMutation.error) : undefined}
        onConfirm={() => {
          if (!removingLogin) return;
          removeLoginMutation.mutate(removingLogin.id, { onSuccess: () => setRemovingLogin(null) });
        }}
        onClose={() => {
          setRemovingLogin(null);
          removeLoginMutation.reset();
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Delete client"
        description={`Are you sure you want to delete "${deleting?.name}"? Their portal login is removed too. This action cannot be undone.`}
        isPending={deleteMutation.isPending}
        error={deleteMutation.isError ? getErrorMessage(deleteMutation.error) : undefined}
        onConfirm={confirmDelete}
        onClose={() => {
          setDeleting(null);
          deleteMutation.reset();
        }}
      />
    </div>
  );
}
