"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  AlertTriangle,
  PackageCheck,
  PackagePlus,
  Truck,
  CheckCircle2,
  XCircle,
  LogOut,
  MessageSquareWarning,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  useNotifications,
  useUnreadCount,
  useMarkRead,
  useMarkAllRead,
} from "@/features/notifications/hooks/useNotifications";
import type { NotificationType } from "@/features/notifications/schemas/notification.schema";

const ICONS: Record<NotificationType, LucideIcon> = {
  LOW_STOCK: AlertTriangle,
  REQUEST_SUBMITTED: PackagePlus,
  REQUEST_APPROVED: PackageCheck,
  REQUEST_REJECTED: XCircle,
  DELIVERY_DISPATCHED: Truck,
  DELIVERY_CONFIRMED: CheckCircle2,
  CHECKOUT_WITH_PENDING_TASKS: LogOut,
  COMPLAINT_RAISED: MessageSquareWarning,
  TASK_REDO_ASSIGNED: RefreshCw,
  OTHER: Bell,
};

const ICON_TONES: Record<NotificationType, string> = {
  LOW_STOCK: "bg-[#ED5F25]/10 text-[#ED5F25]",
  REQUEST_SUBMITTED: "bg-primary/10 text-primary",
  REQUEST_APPROVED: "bg-success/10 text-success",
  REQUEST_REJECTED: "bg-error/10 text-error",
  DELIVERY_DISPATCHED: "bg-primary/10 text-primary",
  DELIVERY_CONFIRMED: "bg-success/10 text-success",
  CHECKOUT_WITH_PENDING_TASKS: "bg-[#ED5F25]/10 text-[#ED5F25]",
  COMPLAINT_RAISED: "bg-error/10 text-error",
  TASK_REDO_ASSIGNED: "bg-primary/10 text-primary",
  OTHER: "bg-grey-100 text-grey-500",
};

/** Deep-link target per notification type for the admin console. */
function linkFor(type: NotificationType): string {
  switch (type) {
    case "COMPLAINT_RAISED":
      return "/admin/complaints";
    case "CHECKOUT_WITH_PENDING_TASKS":
    case "TASK_REDO_ASSIGNED":
      return "/admin/cleaner-logs";
    default:
      return "/admin/inventory";
  }
}

function formatWhen(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unread = useUnreadCount();
  const notifications = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const count = unread.data ?? 0;
  const recent = (notifications.data ?? []).slice(0, 6);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-xl text-grey-600 transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          open && "bg-grey-100 text-on-surface",
        )}
      >
        <Bell size={20} aria-hidden="true" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#ED5F25] px-1 text-[10px] font-semibold text-white ring-2 ring-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-grey-200 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-grey-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-on-surface">Notifications</span>
              {count > 0 && (
                <span className="rounded-full bg-[#ED5F25]/10 px-2 py-0.5 text-[11px] font-medium text-[#ED5F25]">
                  {count} new
                </span>
              )}
            </div>
            {count > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[24rem] overflow-y-auto">
            {notifications.isLoading ? (
              <p className="px-4 py-10 text-center text-sm text-grey-500">Loading…</p>
            ) : recent.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell size={24} className="mx-auto text-grey-300" aria-hidden="true" />
                <p className="mt-2 text-sm text-grey-500">You&apos;re all caught up.</p>
              </div>
            ) : (
              <ul className="flex flex-col">
                {recent.map((n) => {
                  const Icon = ICONS[n.type] ?? Bell;
                  const tone = ICON_TONES[n.type] ?? "bg-grey-100 text-grey-500";
                  return (
                    <li key={n.id}>
                      <Link
                        href={linkFor(n.type)}
                        onClick={() => {
                          if (!n.read) markRead.mutate(n.id);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-grey-50",
                          !n.read && "bg-primary/[0.03]",
                        )}
                      >
                        <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", tone)}>
                          <Icon size={16} aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-sm font-medium text-on-surface">{n.title}</p>
                            <span className="shrink-0 text-[11px] text-grey-400">{formatWhen(n.createdAt)}</span>
                          </div>
                          {n.message && <p className="mt-0.5 line-clamp-2 text-xs text-grey-500">{n.message}</p>}
                        </div>
                        {!n.read && (
                          <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <Link
            href="/admin/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-grey-100 px-4 py-3 text-center text-sm font-medium text-primary transition-colors hover:bg-grey-50"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
