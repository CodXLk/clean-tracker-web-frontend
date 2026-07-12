"use client";

import { useRouter } from "next/navigation";
import { Bell, CalendarDays, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";

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

          {/* Bell with red dot */}
          <button
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition-opacity hover:opacity-80 active:opacity-60"
          >
            <Bell size={18} strokeWidth={2} />
            <span
              aria-hidden="true"
              className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger"
            />
          </button>
        </div>
      </div>
    </header>
  );
}
