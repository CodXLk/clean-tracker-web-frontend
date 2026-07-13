"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  UsersRound,
  Menu,
  X,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { useMe } from "@/features/auth/hooks/useMe";
import { useLogout } from "@/features/auth/hooks/useAuth";
import { ROLE_LABELS } from "@/features/users/schemas/user.schema";

interface NavItemConfig {
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItemConfig[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users",     href: "/admin/users",     icon: Users },
  { label: "Companies", href: "/admin/companies", icon: Building2 },
  { label: "Workforce", href: "/admin/workforce", icon: UsersRound },
];

interface SidebarNavItemProps {
  item: NavItemConfig;
  isActive: boolean;
  onClick?: () => void;
}

function SidebarNavItem({ item, isActive, onClick }: SidebarNavItemProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
        isActive
          ? "bg-[#ED5F25] text-white font-medium"
          : "text-white/70 hover:bg-white/10 font-normal",
      )}
    >
      <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} aria-hidden="true" />
      {item.label}
    </Link>
  );
}

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const me = useMe();
  const logout = useLogout();

  function isItemActive(item: NavItemConfig): boolean {
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  const fullName = me.data
    ? [me.data.firstName, me.data.lastName].filter(Boolean).join(" ")
    : "…";
  const initial = (me.data?.firstName ?? "?").charAt(0).toUpperCase();

  function handleLogout() {
    logout.mutate(undefined, { onSettled: () => router.replace("/login") });
  }

  return (
    <div className="flex h-full flex-col bg-primary">
      {/* Logo / Brand */}
      <div className="px-4 py-6">
        <p className="text-lg font-bold text-white">Primeway</p>
        <p className="text-xs text-white/50">Cleaning Management</p>
      </div>

      {/* Navigation */}
      <nav aria-label="Admin navigation" className="mt-2 flex flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.href}
            item={item}
            isActive={isItemActive(item)}
            onClick={onLinkClick}
          />
        ))}
      </nav>

      {/* User profile */}
      <div className="mt-auto border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#ED5F25] text-sm font-semibold text-white"
            aria-hidden="true"
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{fullName}</p>
            <p className="text-xs text-white/50">{me.data ? ROLE_LABELS[me.data.role] : ""}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={logout.isPending}
            aria-label="Sign out"
            title="Sign out"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:opacity-50"
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-64 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile hamburger button */}
      <button
        type="button"
        aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-md lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed bottom-0 left-0 top-0 z-50 w-64 transform transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Mobile admin navigation"
      >
        <div className="relative h-full">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <X size={18} aria-hidden="true" />
          </button>
          <SidebarContent onLinkClick={() => setMobileOpen(false)} />
        </div>
      </aside>
    </>
  );
}
