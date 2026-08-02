"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
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
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
} from "@/features/notifications/hooks/useNotifications";
import type { Notification, NotificationType } from "@/features/notifications/schemas/notification.schema";

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

/** Cleaner-app deep-link per notification type. */
function linkFor(type: NotificationType): string | null {
  switch (type) {
    case "TASK_REDO_ASSIGNED":
      return "/dashboard/tasks";
    case "COMPLAINT_RAISED":
      return "/dashboard/complaints";
    case "DELIVERY_DISPATCHED":
    case "DELIVERY_CONFIRMED":
    case "LOW_STOCK":
      return "/dashboard/inventory";
    default:
      return null;
  }
}

function formatWhen(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.floor((Date.now() - then) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function CleanerNotificationsPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const notifications = data ?? [];
  const unread = notifications.filter((n) => !n.read).length;

  function open(n: Notification) {
    if (!n.read) markRead.mutate(n.id);
    const href = linkFor(n.type);
    if (href) router.push(href);
  }

  return (
    <div className="min-h-screen bg-grey-50 pb-28">
      <header className="bg-primary px-5 pb-5 pt-6">
        <div className="mx-auto flex max-w-2xl items-center gap-3 lg:max-w-5xl">
          <button
            type="button"
            aria-label="Back"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition-opacity hover:opacity-80"
          >
            <ArrowLeft size={20} strokeWidth={2} />
          </button>
          <div className="flex-1">
            <p className="text-lg font-bold leading-tight text-white">Notifications</p>
            <p className="text-xs text-white/70">{unread > 0 ? `${unread} unread` : "All caught up"}</p>
          </div>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              Mark all read
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 pt-5 lg:max-w-5xl">
        {isLoading ? (
          <p className="py-16 text-center text-sm text-grey-500">Loading…</p>
        ) : isError ? (
          <p className="py-16 text-center text-sm text-error">Failed to load notifications.</p>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-grey-100 bg-white py-16 text-center">
            <Bell size={28} className="mx-auto text-grey-300" aria-hidden="true" />
            <p className="mt-3 text-sm text-grey-500">You&apos;re all caught up.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {notifications.map((n) => {
              const Icon = ICONS[n.type] ?? Bell;
              const tone = ICON_TONES[n.type] ?? "bg-grey-100 text-grey-500";
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => open(n)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
                      n.read ? "border-grey-100 bg-white" : "border-primary/20 bg-primary/[0.03]",
                    )}
                  >
                    <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", tone)}>
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-on-surface">{n.title}</p>
                        <span className="shrink-0 text-xs text-grey-400">{formatWhen(n.createdAt)}</span>
                      </div>
                      {n.message && <p className="mt-0.5 text-sm text-grey-500">{n.message}</p>}
                    </div>
                    {!n.read && <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <BottomNavBar />
    </div>
  );
}
