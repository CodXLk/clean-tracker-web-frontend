"use client";

import { useState } from "react";
import {
  ChevronRight,
  ClipboardCheck,
  Clock,
  FileText,
  Key,
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
import { cn } from "@/lib/utils/cn";
import type { LucideIcon } from "lucide-react";

interface StatCard {
  label:      string;
  value:      string;
  icon:       LucideIcon;
  iconColor:  string;
  iconBg:     string;
}

const STATS: StatCard[] = [
  { label: "Tasks Completed", value: "247",      icon: ClipboardCheck, iconColor: "text-primary",    iconBg: "bg-primary/10"    },
  { label: "Total Hours",     value: "1,856",    icon: Clock,          iconColor: "text-[#ED5F25]",  iconBg: "bg-[#ED5F25]/10"  },
  { label: "Avg. Rating",     value: "9.2/10",   icon: Star,           iconColor: "text-primary",    iconBg: "bg-primary/10"    },
  { label: "Days Active",     value: "108",      icon: CalendarCheck,  iconColor: "text-purple-600", iconBg: "bg-purple-100"    },
];

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
                Id · 1325468
              </span>

              <div className="flex items-center gap-4">
                <div className="h-16 w-16 shrink-0 rounded-full bg-grey-300" aria-label="User avatar" />
                <div>
                  <p className="text-xl font-bold text-on-surface">Peter James</p>
                  <p className="text-xs text-grey-500">Joined · Jan 15, 2026</p>
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
          </div>

          {/* Right column — Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {STATS.map((stat) => {
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

      <BottomNavBar />
    </div>
  );
}
