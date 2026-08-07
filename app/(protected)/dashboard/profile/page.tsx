"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ClipboardCheck,
  Clock,
  FileText,
  Key,
  LogOut,
  Pencil,
  Bell,
  Star,
  CalendarCheck,
} from "lucide-react";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { PageHeader } from "@/components/shared/PageHeader";
import { InvoicesModal } from "@/components/modals/InvoicesModal";
import { EditProfileModal } from "@/components/modals/EditProfileModal";
import { ResetPasswordModal } from "@/components/modals/ResetPasswordModal";
import { NotificationsModal } from "@/components/modals/NotificationsModal";
import { SignOutConfirmModal } from "@/components/modals/SignOutConfirmModal";
import { useLogout } from "@/features/auth/hooks/useAuth";
import { useMe } from "@/features/auth/hooks/useMe";
import { useMyAttendanceHistory } from "@/features/attendance/hooks/useAttendance";
import { useMyTasks } from "@/features/tasks/hooks/useTasks";
import { toLocalDateString } from "@/features/tasks/lib/task-utils";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import type { LucideIcon } from "lucide-react";

interface StatCard {
  label:      string;
  value:      string;
  icon:       LucideIcon;
  iconColor:  string;
  iconBg:     string;
}

// Metadata only — values are computed from real data in the component below.
// "Avg. Rating" has no backing data anywhere in the system yet (no rating concept
// exists in the backend), so it stays a placeholder until that's built.
const STATS_META = [
  { label: "Tasks Completed", icon: ClipboardCheck, iconColor: "text-primary",    iconBg: "bg-primary/10"    },
  { label: "Total Hours",     icon: Clock,          iconColor: "text-[#ED5F25]",  iconBg: "bg-[#ED5F25]/10"  },
  { label: "Avg. Rating",     icon: Star,           iconColor: "text-primary",    iconBg: "bg-primary/10"    },
  { label: "Days Active",     icon: CalendarCheck,  iconColor: "text-purple-600", iconBg: "bg-purple-100"    },
] satisfies Omit<StatCard, "value">[];

interface SettingsRow {
  id:    string;
  label: string;
  icon:  LucideIcon;
}

const SETTINGS_ROWS: SettingsRow[] = [
  { id: "editProfile",  label: "Edit profile",       icon: Pencil },
  { id: "password",     label: "Password & security", icon: Key    },
  { id: "notifications",label: "Notifications",       icon: Bell   },
];

export default function ProfilePage() {
  const [invoicesOpen,      setInvoicesOpen]      = useState(false);
  const [editProfileOpen,   setEditProfileOpen]   = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [signOutOpen,       setSignOutOpen]       = useState(false);

  // Hide the mobile bottom nav while any of these bottom-sheet modals is open, same
  // fix applied to the inventory popups — the desktop sidebar is unaffected.
  const modalOpen =
    invoicesOpen || editProfileOpen || resetPasswordOpen || notificationsOpen || signOutOpen;

  const router = useRouter();
  const logout = useLogout();
  const me = useMe();

  const today = useMemo(() => toLocalDateString(new Date()), []);
  const accountCreatedDate = me.data?.createdAt
    ? toLocalDateString(new Date(me.data.createdAt))
    : today;
  const taskHistory = useMyTasks(accountCreatedDate, today);
  const attendanceHistory = useMyAttendanceHistory();

  const tasksCompleted = (taskHistory.data ?? []).filter((t) => t.status === "COMPLETED").length;
  const daysActive = new Set((attendanceHistory.data ?? []).map((log) => log.occurrenceDate)).size;
  const totalHours = (attendanceHistory.data ?? []).reduce((sum, log) => {
    if (!log.checkInAt || !log.checkOutAt) return sum;
    const ms = new Date(log.checkOutAt).getTime() - new Date(log.checkInAt).getTime();
    return sum + Math.max(ms, 0);
  }, 0) / (1000 * 60 * 60);

  const stats: StatCard[] = [
    { ...STATS_META[0], value: taskHistory.isLoading ? "…" : String(tasksCompleted) },
    { ...STATS_META[1], value: attendanceHistory.isLoading ? "…" : Math.round(totalHours).toLocaleString() },
    { ...STATS_META[2], value: "9.2/10" },
    { ...STATS_META[3], value: attendanceHistory.isLoading ? "…" : String(daysActive) },
  ];

  function handleSignOut() {
    logout.mutate(undefined, {
      onSettled: () => router.replace("/login"),
    });
  }

  function handleSignOutClick() {
    setSignOutOpen(true);
  }

  function handleSettingsClick(id: string) {
    if (id === "editProfile")   { setEditProfileOpen(true);   return; }
    if (id === "password")      { setResetPasswordOpen(true); return; }
    if (id === "notifications") { setNotificationsOpen(true); return; }
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at top left, rgba(71,114,115,0.18) 0%, transparent 60%), #F5F5F5",
      }}
    >
      <PageHeader title="Profile" />

      <main className="mx-auto max-w-2xl px-5 pb-28 lg:max-w-5xl -mt-5">
        <div className="flex flex-col gap-4 pt-5 lg:grid lg:grid-cols-2 lg:items-start">
          {/* Left column */}
          <div className="flex flex-col gap-4">
            {/* Profile card */}
            <div className="relative rounded-2xl bg-white p-4 shadow-sm">
              {/* ID badge */}
              <span className="absolute right-4 top-4 rounded-lg bg-[#ED5F25] px-2 py-0.5 text-xs font-semibold text-white">
                Id · {me.data ? me.data.id.slice(0, 8).toUpperCase() : "…"}
              </span>

              <div className="flex items-center gap-4">
                <div className="h-16 w-16 shrink-0 rounded-full bg-grey-300" aria-label="User avatar" />
                <div>
                  <p className="text-xl font-bold text-on-surface">
                    {me.data ? [me.data.firstName, me.data.lastName].filter(Boolean).join(" ") : "…"}
                  </p>
                  <p className="text-xs text-grey-500">
                    Joined · {me.data?.createdAt ? formatDate(me.data.createdAt) : "…"}
                  </p>
                </div>
              </div>
            </div>

            {/* My Invoices card */}
            <button
              onClick={() => setInvoicesOpen(true)}
              className="flex w-full items-center justify-between rounded-2xl bg-white p-4 shadow-sm text-left transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <FileText size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">My Invoices</p>
                  <p className="text-xs text-grey-500">View payment history</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-grey-500" />
            </button>

            {/* Settings */}
            <div className="flex flex-col gap-2">
              {SETTINGS_ROWS.map((row) => {
                const Icon = row.icon;
                return (
                  <button
                    key={row.id}
                    onClick={() => handleSettingsClick(row.id)}
                    className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm text-left transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} className="text-grey-700" />
                      <span className="text-sm font-medium text-on-surface">{row.label}</span>
                    </div>
                    <ChevronRight size={16} className="text-grey-500" />
                  </button>
                );
              })}
            </div>

            {/* Sign out */}
            <button
              onClick={handleSignOutClick}
              disabled={logout.isPending}
              className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm text-left transition-shadow hover:shadow-md disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <LogOut size={18} className="text-danger" />
                <span className="text-sm font-medium text-danger">
                  {logout.isPending ? "Signing out…" : "Sign out"}
                </span>
              </div>
              <ChevronRight size={16} className="text-grey-500" />
            </button>
          </div>

          {/* Right column — Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex flex-col items-start gap-2 rounded-2xl bg-white p-4 shadow-sm"
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full",
                      stat.iconBg,
                    )}
                  >
                    <Icon size={18} className={stat.iconColor} />
                  </div>
                  <p className="text-xl font-bold text-on-surface leading-none">{stat.value}</p>
                  <p className="text-xs text-grey-500 leading-snug">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Modals */}
      <InvoicesModal
        open={invoicesOpen}
        onClose={() => setInvoicesOpen(false)}
      />
      <EditProfileModal
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
      />
      <ResetPasswordModal
        open={resetPasswordOpen}
        onClose={() => setResetPasswordOpen(false)}
      />
      <NotificationsModal
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
      <SignOutConfirmModal
        open={signOutOpen}
        onConfirm={handleSignOut}
        onCancel={() => setSignOutOpen(false)}
        isPending={logout.isPending}
      />

      <BottomNavBar hideMobileBar={modalOpen} />
    </div>
  );
}
