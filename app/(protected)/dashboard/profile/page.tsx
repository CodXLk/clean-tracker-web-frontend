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
  Repeat,
  Star,
  CalendarCheck,
  CalendarClock,
  ShieldCheck,
  UserX,
} from "lucide-react";
import { useIsDrawerNav } from "@/components/layout/AppNav";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { EditProfileModal } from "@/components/modals/EditProfileModal";
import { ResetPasswordModal } from "@/components/modals/ResetPasswordModal";
import { NotificationsModal } from "@/components/modals/NotificationsModal";
import { SignOutConfirmModal } from "@/components/modals/SignOutConfirmModal";
import { UserDocumentsModal } from "@/features/users/components/UserDocumentsModal";
import { useLogout } from "@/features/auth/hooks/useAuth";
import { useMe } from "@/features/auth/hooks/useMe";
import { useInvoiceAccess } from "@/features/invoices/hooks/useInvoices";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useMyAttendanceHistory } from "@/features/attendance/hooks/useAttendance";
import { useMyTasks } from "@/features/tasks/hooks/useTasks";
import { toLocalDateString } from "@/features/tasks/lib/task-utils";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import { hasAccountOnlyProfile } from "@/lib/auth/roles";
import { ROLE_LABELS } from "@/features/users/schemas/user.schema";
import type { LucideIcon } from "lucide-react";

/** Same deletion-request inbox the mobile app uses. */
const ACCOUNT_DELETION_EMAIL = "support@aurionx.lk";
const ACCOUNT_DELETION_MAILTO = `mailto:${ACCOUNT_DELETION_EMAIL}?subject=Account%20deletion%20request`;

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
  { label: "Tasks Completed", icon: ClipboardCheck, iconColor: "text-ink",    iconBg: "bg-primary/10"    },
  { label: "Total Hours",     icon: Clock,          iconColor: "text-[#ED5F25]",  iconBg: "bg-[#ED5F25]/10"  },
  { label: "Avg. Rating",     icon: Star,           iconColor: "text-ink",    iconBg: "bg-primary/10"    },
  { label: "Days Active",     icon: CalendarCheck,  iconColor: "text-purple-600", iconBg: "bg-purple-100"    },
] satisfies Omit<StatCard, "value">[];

interface SettingsRow {
  id:    string;
  label: string;
  icon:  LucideIcon;
}

const SETTINGS_ROWS: SettingsRow[] = [
  { id: "editProfile",  label: "Edit profile",       icon: Pencil },
  { id: "documents",    label: "My documents",        icon: ShieldCheck },
  { id: "password",     label: "Password & security", icon: Key    },
  { id: "notifications",label: "Notifications",       icon: Bell   },
];

export default function ProfilePage() {
  const useDrawerNav = useIsDrawerNav();
  const [editProfileOpen,   setEditProfileOpen]   = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [documentsOpen,     setDocumentsOpen]     = useState(false);
  const [signOutOpen,       setSignOutOpen]       = useState(false);

  const router = useRouter();
  const logout = useLogout();
  const me = useMe();
  // Super admins, company admins and clients: account settings only — no compliance documents and no
  // field work stats (they have no tasks, shifts or attendance of their own).
  const accountOnly = hasAccountOnlyProfile(me.data?.role);
  const settingsRows = accountOnly ? SETTINGS_ROWS.filter((r) => r.id !== "documents") : SETTINGS_ROWS;
  // Only in-house cleaners and supervisors have invoices (client invoices are separate).
  const hasInvoices = useInvoiceAccess(!!me.data && me.data.role !== "CLIENT").data?.eligible ?? false;
  // Users assigned more than one role can switch the active role without re-entering credentials.
  const canSwitchRole = (me.data?.roles?.length ?? 0) > 1;
  const canRequestLeave = me.data?.role === "CLEANER" || me.data?.role === "SUPERVISOR";
  const hasShifts = me.data?.role === "CLEANER";

  const today = useMemo(() => toLocalDateString(new Date()), []);
  const accountCreatedDate = me.data?.createdAt
    ? toLocalDateString(new Date(me.data.createdAt))
    : today;
  const showStats = !!me.data && !accountOnly;
  const taskHistory = useMyTasks(accountCreatedDate, today, undefined, showStats);
  const attendanceHistory = useMyAttendanceHistory(showStats);

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
    if (id === "documents")     { setDocumentsOpen(true);     return; }
    if (id === "password")      { setResetPasswordOpen(true); return; }
    if (id === "notifications") { setNotificationsOpen(true); return; }
  }

  return (
    <>
      {/* ---------- Desktop (admin-style console) ---------- */}
      <div className={cn("p-6 lg:p-8", useDrawerNav ? "block" : "hidden lg:block")}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <p className="text-sm text-grey-500">Your account details and settings</p>
          </div>

          {showStats && (
          <div className="mb-6 grid grid-cols-4 gap-2 sm:gap-4">
            {stats.map((stat) => (
              <AdminStatCard
                key={stat.label}
                icon={stat.icon}
                iconBg={stat.iconBg}
                iconColor={stat.iconColor}
                value={stat.value}
                label={stat.label}
              />
            ))}
          </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section className="rounded-2xl bg-surface p-5 shadow-sm">
              <div className="relative">
                <span className="absolute right-0 top-0 rounded-lg bg-[#ED5F25] px-2 py-0.5 text-xs font-semibold text-white">
                  Id · {me.data ? me.data.id.slice(0, 8).toUpperCase() : "…"}
                </span>
                <div className="flex items-center gap-4">
                  {me.data ? (
                    <UserAvatar
                      userId={me.data.id}
                      hasPhoto={me.data.hasPhoto}
                      version={me.data.updatedAt}
                      firstName={me.data.firstName}
                      lastName={me.data.lastName}
                      size={64}
                    />
                  ) : (
                    <div className="h-16 w-16 shrink-0 rounded-full bg-grey-300" aria-label="User avatar" />
                  )}
                  <div>
                    <p className="text-xl font-bold text-on-surface">
                      {me.data ? [me.data.firstName, me.data.lastName].filter(Boolean).join(" ") : "…"}
                    </p>
                    {accountOnly && me.data && (
                      <>
                        <p className="text-xs font-medium text-ink">{ROLE_LABELS[me.data.role]}</p>
                        <p className="truncate text-xs text-grey-500">{me.data.email}</p>
                      </>
                    )}
                    <p className="text-xs text-grey-500">
                      Joined · {me.data?.createdAt ? formatDate(me.data.createdAt) : "…"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-surface p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-on-surface">Settings</h2>
              <div className="flex flex-col">
                {hasInvoices && (
                <button
                  onClick={() => router.push("/dashboard/invoices")}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-grey-50"
                >
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-ink" />
                    <div>
                      <p className="text-sm font-medium text-on-surface">My Invoices</p>
                      <p className="text-xs text-grey-500">Create, complete and track your invoices</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-grey-500" />
                </button>
                )}

                {settingsRows.map((row) => {
                  const Icon = row.icon;
                  return (
                    <button
                      key={row.id}
                      onClick={() => handleSettingsClick(row.id)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-grey-50"
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} className="text-grey-700" />
                        <span className="text-sm font-medium text-on-surface">{row.label}</span>
                      </div>
                      <ChevronRight size={16} className="text-grey-500" />
                    </button>
                  );
                })}

                {hasShifts && (
                  <button
                    onClick={() => router.push("/dashboard/shifts")}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-grey-50"
                  >
                    <div className="flex items-center gap-3">
                      <Clock size={18} className="text-grey-700" />
                      <span className="text-sm font-medium text-on-surface">My shifts</span>
                    </div>
                    <ChevronRight size={16} className="text-grey-500" />
                  </button>
                )}

                {canRequestLeave && (
                  <button
                    onClick={() => router.push("/dashboard/leave")}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-grey-50"
                  >
                    <div className="flex items-center gap-3">
                      <CalendarClock size={18} className="text-grey-700" />
                      <span className="text-sm font-medium text-on-surface">My leave</span>
                    </div>
                    <ChevronRight size={16} className="text-grey-500" />
                  </button>
                )}

                {canSwitchRole && (
                  <button
                    onClick={() => router.push("/select-role")}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-grey-50"
                  >
                    <div className="flex items-center gap-3">
                      <Repeat size={18} className="text-grey-700" />
                      <span className="text-sm font-medium text-on-surface">Switch role</span>
                    </div>
                    <ChevronRight size={16} className="text-grey-500" />
                  </button>
                )}

                {accountOnly && (
                  <>
                    <a
                      href={ACCOUNT_DELETION_MAILTO}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-grey-50"
                    >
                      <div className="flex items-center gap-3">
                        <UserX size={18} className="text-grey-700" />
                        <span className="text-sm font-medium text-on-surface">Request account deletion</span>
                      </div>
                      <ChevronRight size={16} className="text-grey-500" />
                    </a>
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-grey-50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-grey-700" />
                        <span className="text-sm font-medium text-on-surface">Privacy policy</span>
                      </div>
                      <ChevronRight size={16} className="text-grey-500" />
                    </a>
                  </>
                )}

                <button
                  onClick={handleSignOutClick}
                  disabled={logout.isPending}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-grey-50 disabled:opacity-60"
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
            </section>
          </div>
        </div>
      </div>

      {/* ---------- Mobile (cleaner-style layout) ---------- */}
      <div
        className={cn("min-h-screen", useDrawerNav ? "hidden" : "lg:hidden")}
        style={{
          background:
            "radial-gradient(ellipse at top left, rgba(71,114,115,0.18) 0%, transparent 60%), #F5F5F5",
        }}
      >
        {!useDrawerNav && <PageHeader title="Profile" />}

        <main className={cn("mx-auto max-w-2xl px-5 pb-28", !useDrawerNav ? "-mt-5" : "pt-5")}>
          <div className="flex flex-col gap-4 pt-5">
            {/* Profile card */}
            <div className="relative rounded-2xl bg-white p-4 shadow-sm">
              {/* ID badge */}
              <span className="absolute right-4 top-4 rounded-lg bg-[#ED5F25] px-2 py-0.5 text-xs font-semibold text-white">
                Id · {me.data ? me.data.id.slice(0, 8).toUpperCase() : "…"}
              </span>

              <div className="flex items-center gap-4">
                {me.data ? (
                  <UserAvatar
                    userId={me.data.id}
                    hasPhoto={me.data.hasPhoto}
                    version={me.data.updatedAt}
                    firstName={me.data.firstName}
                    lastName={me.data.lastName}
                    size={64}
                  />
                ) : (
                  <div className="h-16 w-16 shrink-0 rounded-full bg-grey-300" aria-label="User avatar" />
                )}
                <div>
                  <p className="text-xl font-bold text-on-surface">
                    {me.data ? [me.data.firstName, me.data.lastName].filter(Boolean).join(" ") : "…"}
                  </p>
                  {accountOnly && me.data && (
                    <>
                      <p className="text-xs font-medium text-ink">{ROLE_LABELS[me.data.role]}</p>
                      <p className="truncate text-xs text-grey-500">{me.data.email}</p>
                    </>
                  )}
                  <p className="text-xs text-grey-500">
                    Joined · {me.data?.createdAt ? formatDate(me.data.createdAt) : "…"}
                  </p>
                </div>
              </div>
            </div>

            {/* My Invoices card (in-house cleaners and supervisors only) */}
            {hasInvoices && (
            <button
              onClick={() => router.push("/dashboard/invoices")}
              className="flex w-full items-center justify-between rounded-2xl bg-white p-4 shadow-sm text-left transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <FileText size={20} className="text-ink" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">My Invoices</p>
                  <p className="text-xs text-grey-500">Create, complete and track your invoices</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-grey-500" />
            </button>
            )}

            {/* Settings */}
            <div className="flex flex-col gap-2">
              {settingsRows.map((row) => {
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

              {hasShifts && (
                <button
                  onClick={() => router.push("/dashboard/shifts")}
                  className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm text-left transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-grey-700" />
                    <span className="text-sm font-medium text-on-surface">My shifts</span>
                  </div>
                  <ChevronRight size={16} className="text-grey-500" />
                </button>
              )}

              {canRequestLeave && (
                <button
                  onClick={() => router.push("/dashboard/leave")}
                  className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm text-left transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <CalendarClock size={18} className="text-grey-700" />
                    <span className="text-sm font-medium text-on-surface">My leave</span>
                  </div>
                  <ChevronRight size={16} className="text-grey-500" />
                </button>
              )}

              {canSwitchRole && (
                <button
                  onClick={() => router.push("/select-role")}
                  className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm text-left transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <Repeat size={18} className="text-grey-700" />
                    <span className="text-sm font-medium text-on-surface">Switch role</span>
                  </div>
                  <ChevronRight size={16} className="text-grey-500" />
                </button>
              )}
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

            {accountOnly && (
              <>
                <a
                  href={ACCOUNT_DELETION_MAILTO}
                  className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm text-left transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <UserX size={18} className="text-grey-700" />
                    <span className="text-sm font-medium text-on-surface">Request account deletion</span>
                  </div>
                  <ChevronRight size={16} className="text-grey-500" />
                </a>
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm text-left transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-grey-700" />
                    <span className="text-sm font-medium text-on-surface">Privacy policy</span>
                  </div>
                  <ChevronRight size={16} className="text-grey-500" />
                </a>
              </>
            )}

            {/* Stats grid */}
            {showStats && (
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
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
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
      <UserDocumentsModal
        open={documentsOpen}
        onClose={() => setDocumentsOpen(false)}
        user={me.data ?? null}
      />
      <SignOutConfirmModal
        open={signOutOpen}
        onConfirm={handleSignOut}
        onCancel={() => setSignOutOpen(false)}
        isPending={logout.isPending}
      />
    </>
  );
}
