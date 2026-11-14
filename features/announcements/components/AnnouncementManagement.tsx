"use client";

import { useMemo, useState } from "react";
import { Eye, Megaphone, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Modal } from "@/components/shared/Modal";
import { SearchInput } from "@/components/shared/SearchInput";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { DataTable, type Column } from "@/features/user-management/components/DataTable";
import { RowMenu } from "@/features/user-management/components/RowMenu";
import { ConfirmDialog } from "@/features/user-management/components/ConfirmDialog";
import { AnnouncementComposer } from "@/features/announcements/components/AnnouncementComposer";
import { formatAnnouncementDate } from "@/features/announcements/lib/format";
import { useDeleteAnnouncement, useSentAnnouncements } from "@/features/announcements/hooks/useAnnouncements";
import type { Announcement } from "@/features/announcements/schemas/announcement.schema";

const PRIORITY_FILTERS = ["All", "Urgent", "Normal"] as const;
type PriorityFilter = (typeof PRIORITY_FILTERS)[number];

/** Management table of sent announcements: search, sort, read reach, view and delete. */
export function AnnouncementManagement() {
  const query = useSentAnnouncements();
  const deleteMutation = useDeleteAnnouncement();

  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<PriorityFilter>("All");
  const [composing, setComposing] = useState(false);
  const [viewing, setViewing] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState<Announcement | null>(null);

  const rows = useMemo(() => {
    const all = query.data?.pages.flat() ?? [];
    const q = search.trim().toLowerCase();
    return all.filter((a) => {
      if (priority === "Urgent" && !a.urgent) return false;
      if (priority === "Normal" && a.urgent) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.message.toLowerCase().includes(q) ||
        (a.audienceSummary ?? "").toLowerCase().includes(q) ||
        (a.createdByName ?? "").toLowerCase().includes(q)
      );
    });
  }, [query.data, search, priority]);

  const columns: Column<Announcement>[] = [
    {
      header: "Announcement",
      sortAccessor: (a) => a.title.toLowerCase(),
      cell: (a) => (
        <button type="button" onClick={() => setViewing(a)} className="flex max-w-md items-start gap-3 text-left">
          <span
            className={cn(
              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              a.urgent ? "bg-error/10 text-error" : "bg-primary/10 text-ink",
            )}
          >
            <Megaphone size={16} aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block font-medium text-on-surface hover:underline">{a.title}</span>
            <span className="line-clamp-1 text-xs text-grey-500">{a.message}</span>
          </span>
        </button>
      ),
    },
    {
      header: "Priority",
      sortAccessor: (a) => (a.urgent ? 0 : 1),
      cell: (a) => <PriorityPill urgent={a.urgent} />,
    },
    {
      header: "Audience",
      cell: (a) => (
        <span className="line-clamp-2 max-w-[14rem] text-xs text-grey-600" title={a.audienceSummary ?? undefined}>
          {a.audienceSummary ?? "—"}
        </span>
      ),
    },
    {
      header: "Sent by",
      sortAccessor: (a) => (a.createdByName ?? "").toLowerCase(),
      cell: (a) => <span className="text-sm text-on-surface">{a.createdByName ?? "—"}</span>,
    },
    {
      header: "Sent",
      sortAccessor: (a) => a.createdAt,
      cell: (a) => (
        <span className="whitespace-nowrap text-xs text-grey-600" title={new Date(a.createdAt).toLocaleString()}>
          {formatAnnouncementDate(a.createdAt)}
        </span>
      ),
    },
    {
      header: "Read",
      sortAccessor: (a) => readRatio(a),
      cell: (a) => <ReadProgress announcement={a} />,
    },
    {
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (a) => (
        <div className="flex justify-end">
          <RowMenu
            label={`Actions for ${a.title}`}
            items={[
              { label: "View", icon: Eye, onClick: () => setViewing(a) },
              { label: "Delete", icon: Trash2, destructive: true, onClick: () => setDeleting(a) },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search announcements…"
            className="sm:max-w-xs"
          />
          <div className="flex gap-1 rounded-full bg-grey-100 p-1" role="tablist" aria-label="Filter by priority">
            {PRIORITY_FILTERS.map((p) => (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={priority === p}
                onClick={() => setPriority(p)}
                className={cn(
                  "flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none",
                  priority === p ? "bg-white text-on-surface shadow-sm" : "text-grey-500 hover:text-on-surface",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setComposing(true)}
          className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
        >
          <Plus size={18} aria-hidden="true" />
          New announcement
        </button>
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(a) => a.id}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage="Failed to load announcements."
        emptyTitle="No announcements yet"
        emptyDescription="Send your first announcement to staff. It arrives as a push notification on their phones."
      />

      {query.hasNextPage && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
            className="rounded-full border border-grey-300 px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100 disabled:opacity-50"
          >
            {query.isFetchingNextPage ? "Loading…" : "Load older announcements"}
          </button>
        </div>
      )}

      <AnnouncementComposer open={composing} onClose={() => setComposing(false)} />

      <AnnouncementDetailModal announcement={viewing} onClose={() => setViewing(null)} />

      <ConfirmDialog
        open={!!deleting}
        title="Delete announcement"
        description={`Delete "${deleting?.title}"? It will be removed from everyone's notifications. Push notifications already delivered to phones can't be recalled.`}
        isPending={deleteMutation.isPending}
        error={deleteMutation.isError ? getErrorMessage(deleteMutation.error) : undefined}
        onConfirm={() => {
          if (deleting) deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
        }}
        onClose={() => {
          setDeleting(null);
          deleteMutation.reset();
        }}
      />
    </div>
  );
}

function readRatio(a: Announcement): number {
  const total = a.recipientCount ?? 0;
  return total > 0 ? (a.readCount ?? 0) / total : 0;
}

function PriorityPill({ urgent }: { urgent: boolean }) {
  return (
    <span
      className={cn(
        "whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        urgent ? "bg-error/10 text-error" : "bg-grey-100 text-grey-700",
      )}
    >
      {urgent ? "Urgent" : "Normal"}
    </span>
  );
}

function ReadProgress({ announcement: a }: { announcement: Announcement }) {
  const total = a.recipientCount ?? 0;
  const read = a.readCount ?? 0;
  const pct = Math.round(readRatio(a) * 100);
  return (
    <div className="min-w-[7rem]" title={`${read} of ${total} have read it`}>
      <p className="text-xs text-on-surface">
        <span className="font-medium">{read}</span>
        <span className="text-grey-500">
          {" "}
          / {total} · {pct}%
        </span>
      </p>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-grey-100" aria-hidden="true">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function AnnouncementDetailModal({ announcement: a, onClose }: { announcement: Announcement | null; onClose: () => void }) {
  return (
    <Modal open={!!a} onClose={onClose} title={a?.title ?? "Announcement"} maxWidthClassName="max-w-xl">
      {a && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <PriorityPill urgent={a.urgent} />
            <span className="text-xs text-grey-500">{new Date(a.createdAt).toLocaleString()}</span>
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-on-surface">{a.message}</p>
          <dl className="grid grid-cols-1 gap-3 rounded-xl bg-grey-50 p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-grey-500">Audience</dt>
              <dd className="mt-0.5 text-on-surface">{a.audienceSummary ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-grey-500">Sent by</dt>
              <dd className="mt-0.5 text-on-surface">{a.createdByName ?? "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="mb-1 text-xs text-grey-500">Read</dt>
              <dd>
                <ReadProgress announcement={a} />
              </dd>
            </div>
          </dl>
        </div>
      )}
    </Modal>
  );
}
