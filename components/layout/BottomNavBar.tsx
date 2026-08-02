"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  ClipboardList,
  LogOut,
  MessageSquare,
  Package,
  User,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useMe } from "@/features/auth/hooks/useMe";
import { useLogout } from "@/features/auth/hooks/useAuth";
import { ROLE_LABELS } from "@/features/users/schemas/user.schema";
import { SignOutConfirmModal } from "@/components/modals/SignOutConfirmModal";

interface NavItemConfig {
  label: string;
  href:  string;
  icon:  LucideIcon;
}

const NAV_ITEMS: NavItemConfig[] = [
  { label: "Home",       href: "/dashboard",            icon: Home },
  { label: "Tasks",      href: "/dashboard/tasks",       icon: ClipboardList },
  { label: "Complaints", href: "/dashboard/complaints",  icon: MessageSquare },
  { label: "Inventory",  href: "/dashboard/inventory",   icon: Package },
  { label: "Profile",    href: "/dashboard/profile",     icon: User },
];

/** Supervisors get an extra entry point into the Workforce & Management console. */
const SUPERVISOR_ITEM: NavItemConfig = {
  label: "Workforce",
  href:  "/admin/workforce",
  icon:  UsersRound,
};

interface NavItemProps {
  item:     NavItemConfig;
  isActive: boolean;
}

export function NavItem({ item, isActive }: NavItemProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className="flex flex-1 flex-col items-center gap-1 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-200",
          isActive ? "bg-primary" : "bg-transparent",
        )}
      >
        <Icon
          size={22}
          strokeWidth={isActive ? 2.5 : 1.75}
          className={cn(
            "transition-colors duration-200",
            isActive ? "text-on-primary" : "text-nav-icon-inactive",
          )}
          aria-hidden="true"
        />
      </span>
      <span
        className={cn(
          "text-[11px] leading-none transition-colors duration-200",
          isActive
            ? "font-semibold text-primary"
            : "font-medium text-nav-icon-inactive",
        )}
      >
        {item.label}
      </span>
    </Link>
  );
}

function SidebarItem({ item, isActive }: NavItemProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-grey-700 hover:bg-grey-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
      )}
    >
      <Icon
        size={20}
        strokeWidth={isActive ? 2.5 : 1.75}
        aria-hidden="true"
      />
      {item.label}
    </Link>
  );
}

interface BottomNavBarProps {
  /** Hide only the mobile bottom bar (e.g. while a bottom-sheet panel is open) — the
   *  desktop sidebar stays visible since it never overlaps those panels. */
  hideMobileBar?: boolean;
}

export function BottomNavBar({ hideMobileBar = false }: BottomNavBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);
  const me = useMe();
  const logout = useLogout();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const items =
    role === "SUPERVISOR"
      ? [...NAV_ITEMS.slice(0, 4), SUPERVISOR_ITEM, NAV_ITEMS[4]]
      : NAV_ITEMS;

  function isItemActive(item: NavItemConfig): boolean {
    if (item.href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(item.href);
  }

  const fullName = me.data
    ? [me.data.firstName, me.data.lastName].filter(Boolean).join(" ")
    : "…";
  const initial = (me.data?.firstName ?? "?").charAt(0).toUpperCase();

  function handleLogout() {
    logout.mutate(undefined, { onSettled: () => router.replace("/login") });
  }

  return (
    <>
      {/* Desktop sidebar — visible on lg+ screens */}
      <nav
        aria-label="Main navigation"
        className="hidden lg:flex fixed left-0 top-0 bottom-0 z-50 w-64 flex-col gap-1 border-r border-grey-300 bg-surface px-3 py-8"
      >
        {/* App name / logo area */}
        <div className="mb-6 px-4">
          <span className="text-lg font-bold text-primary">CleanTracker</span>
        </div>

        {items.map((item) => (
          <SidebarItem
            key={item.href}
            item={item}
            isActive={isItemActive(item)}
          />
        ))}

        {/* User profile + logout */}
        <div className="mt-auto flex items-center gap-3 border-t border-grey-300 pt-4">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-on-primary"
            aria-hidden="true"
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-on-surface">{fullName}</p>
            <p className="truncate text-xs text-grey-500">
              {me.data ? ROLE_LABELS[me.data.role] : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSignOutOpen(true)}
            disabled={logout.isPending}
            aria-label="Sign out"
            title="Sign out"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </nav>

      <SignOutConfirmModal
        open={signOutOpen}
        onConfirm={handleLogout}
        onCancel={() => setSignOutOpen(false)}
        isPending={logout.isPending}
      />

      {/* Mobile / tablet bottom bar — hidden on lg+ screens */}
      {!hideMobileBar && (
        <nav
          aria-label="Main navigation"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center border-t border-grey-300 bg-surface"
        >
          {items.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              isActive={isItemActive(item)}
            />
          ))}
        </nav>
      )}
    </>
  );
}
