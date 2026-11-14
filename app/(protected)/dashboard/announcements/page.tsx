"use client";

import { Megaphone } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useMarkRead } from "@/features/notifications/hooks/useNotifications";
import { formatAnnouncementDate } from "@/features/announcements/lib/format";
import { useMyAnnouncements } from "@/features/announcements/hooks/useAnnouncements";

/** Staff: announcements addressed to me, newest first. */
export default function MyAnnouncementsPage() {
  const mine = useMyAnnouncements();
  const markRead = useMarkRead();
  const items = mine.data?.pages.flat() ?? [];

  return (
    <main className="mx-auto max-w-2xl px-5 pb-28 pt-5 lg:max-w-3xl">
      {mine.isLoading ? (
        <p className="py-16 text-center text-sm text-grey-500">Loading…</p>
      ) : mine.isError ? (
        <p className="py-16 text-center text-sm text-error">Failed to load announcements.</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-grey-100 bg-white py-16 text-center">
          <Megaphone size={28} className="mx-auto text-grey-300" aria-hidden="true" />
          <p className="mt-3 text-sm text-grey-500">No announcements yet.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((a) => (
            <li
              key={a.id}
              className={cn(
                "rounded-2xl border bg-white p-4",
                a.urgent ? "border-error/30 bg-error/[0.03]" : a.read ? "border-grey-100" : "border-primary/20",
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    a.urgent ? "bg-error/10 text-error" : "bg-primary/10 text-ink",
                  )}
                >
                  <Megaphone size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-on-surface">
                      {a.urgent && (
                        <span className="mr-2 rounded-full bg-error/10 px-2 py-0.5 text-[11px] font-medium text-error">
                          Urgent
                        </span>
                      )}
                      {a.title}
                    </p>
                    <span className="shrink-0 text-xs text-grey-400">{formatAnnouncementDate(a.createdAt)}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm text-grey-600">{a.message}</p>
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs text-grey-500">
                    <span>{a.createdByName ? `From ${a.createdByName}` : ""}</span>
                    {!a.read && a.notificationId && (
                      <button
                        type="button"
                        onClick={() => markRead.mutate(a.notificationId!)}
                        disabled={markRead.isPending}
                        className="font-medium text-ink hover:underline disabled:opacity-50"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {mine.hasNextPage && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => mine.fetchNextPage()}
            disabled={mine.isFetchingNextPage}
            className="rounded-full border border-grey-200 bg-white px-4 py-2 text-sm font-medium text-on-surface hover:bg-grey-50 disabled:opacity-50"
          >
            {mine.isFetchingNextPage ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </main>
  );
}
