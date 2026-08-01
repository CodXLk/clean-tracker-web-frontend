"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  PackageCheck,
  PackagePlus,
  Truck,
  CheckCircle2,
  XCircle,
  Bell,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { FilterTabs } from "@/components/shared/FilterTabs";
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
} from "@/features/notifications/hooks/useNotifications";
import type {
  Notification,
  NotificationType,
} from "@/features/notifications/schemas/notification.schema";

const ICONS: Record<NotificationType, LucideIcon> = {
  LOW_STOCK: AlertTriangle,
  REQUEST_SUBMITTED: PackagePlus,
  REQUEST_APPROVED: PackageCheck,
  REQUEST_REJECTED: XCircle,
  DELIVERY_DISPATCHED: Truck,
  DELIVERY_CONFIRMED: CheckCircle2,
};

const ICON_TONES: Record<NotificationType, string> = {
  LOW_STOCK: "bg-[#ED5F25]/10 text-[#ED5F25]",
  REQUEST_SUBMITTED: "bg-primary/10 text-primary",
  REQUEST_APPROVED: "bg-success/10 text-success",
  REQUEST_REJECTED: "bg-error/10 text-error",
  DELIVERY_DISPATCHED: "bg-primary/10 text-primary",
  DELIVERY_CONFIRMED: "bg-success/10 text-success",
};

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

const TABS = ["All", "Unread"] as const;
type Tab = (typeof TABS)[number];

function NotificationRow({ n }: { n: Notification }) {
  const markRead = useMarkRead();
  const Icon = ICONS[n.type] ?? Bell;
  const tone = ICON_TONES[n.type] ?? "bg-grey-100 text-grey-500";

  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4 transition-colors",
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
        <div className="mt-2 flex items-center gap-3">
          {n.type === "LOW_STOCK" && (
            <Link href="/admin/inventory" className="text-xs font-medium text-primary hover:underline">
              View inventory
            </Link>
          )}
          {(n.type === "REQUEST_SUBMITTED" ||
            n.type === "REQUEST_APPROVED" ||
            n.type === "REQUEST_REJECTED") && (
            <Link href="/admin/inventory" className="text-xs font-medium text-primary hover:underline">
              View requests
            </Link>
          )}
          {(n.type === "DELIVERY_DISPATCHED" || n.type === "DELIVERY_CONFIRMED") && (
            <Link href="/admin/inventory" className="text-xs font-medium text-primary hover:underline">
              View deliveries
            </Link>
          )}
          {!n.read && (
            <button
              type="button"
              onClick={() => markRead.mutate(n.id)}
              disabled={markRead.isPending}
              className="text-xs font-medium text-grey-500 hover:text-on-surface disabled:opacity-50"
            >
              Mark as read
            </button>
          )}
        </div>
      </div>

      {!n.read && <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
    </li>
  );
}

export default function NotificationsPage() {
  const { data, isLoading, isError } = useNotifications();
  const markAllRead = useMarkAllRead();
  const [tab, setTab] = useState<Tab>("All");

  const notifications = useMemo(() => data ?? [], [data]);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const visible = tab === "Unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-grey-500">
              Stock alerts, requests and delivery updates.
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="shrink-0 rounded-xl border border-grey-200 px-3 py-2 text-sm font-medium text-on-surface hover:bg-grey-50 disabled:opacity-50"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="mb-6">
          <FilterTabs<Tab> options={[...TABS]} value={tab} onChange={setTab} />
        </div>

        {isLoading ? (
          <p className="py-16 text-center text-sm text-grey-500">Loading…</p>
        ) : isError ? (
          <p className="py-16 text-center text-sm text-error">Failed to load notifications.</p>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-grey-100 bg-white py-16 text-center">
            <Bell size={28} className="mx-auto text-grey-300" aria-hidden="true" />
            <p className="mt-3 text-sm text-grey-500">
              {tab === "Unread" ? "No unread notifications." : "You're all caught up."}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {visible.map((n) => (
              <NotificationRow key={n.id} n={n} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
