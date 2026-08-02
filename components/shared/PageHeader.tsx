"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, CalendarDays, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useUnreadCount } from "@/features/notifications/hooks/useNotifications";

interface PageHeaderProps {
  title:          string;
  onBack?:        () => void;
  showAvatar?:    boolean;
  showCalendar?:  boolean;
  onCalendarClick?: () => void;
  className?:     string;
}

export function PageHeader({
  title,
  onBack,
  showAvatar = true,
  showCalendar = false,
  onCalendarClick,
  className,
}: PageHeaderProps) {
  const router = useRouter();
  const { data: unreadCount = 0 } = useUnreadCount();

  function handleBack() {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  }

  return (
    <header
      className={cn(
        "bg-primary rounded-b-[40px] px-5 pt-14 pb-8 mb-5",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        {/* Back button */}
        <button
          onClick={handleBack}
          aria-label="Go back"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition-opacity hover:opacity-80 active:opacity-60"
        >
          <ChevronLeft size={22} strokeWidth={2} />
        </button>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-white">{title}</h1>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {showAvatar && (
            <div
              aria-label="User avatar"
              className="h-10 w-10 rounded-full bg-grey-300"
            />
          )}

          {showCalendar && (
            <button
              onClick={onCalendarClick}
              aria-label="Open calendar"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition-opacity hover:opacity-80 active:opacity-60"
            >
              <CalendarDays size={18} strokeWidth={2} />
            </button>
          )}

          {/* Bell */}
          <Link
            href="/dashboard/notifications"
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition-opacity hover:opacity-80 active:opacity-60"
          >
            <Bell size={18} strokeWidth={2} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white ring-2 ring-primary">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
