"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UsersRound,
  ContactRound,
  ChevronDown,
  ClipboardCheck,
  MessageSquare,
  Package,
  Footprints,
  X,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { useMe } from "@/features/auth/hooks/useMe";
import { useLogout } from "@/features/auth/hooks/useAuth";
import { useUIStore } from "@/store/ui.store";
import { ROLE_LABELS } from "@/features/users/schemas/user.schema";

interface NavChild {
  label: string;
  href: string;
}

interface NavItemConfig {
  label: string;
  icon: LucideIcon;
  /** Leaf items link directly. */
  href?: string;
  /** Parent items expand/collapse a submenu instead of linking. */
  children?: NavChild[];
}

const NAV_ITEMS: NavItemConfig[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Workforce", href: "/admin/workforce", icon: UsersRound },
  { label: "Inspections", href: "/admin/inspections", icon: ClipboardCheck },
  { label: "Complaints",  href: "/admin/complaints",  icon: MessageSquare },
  { label: "Inventory",   href: "/admin/inventory",  icon: Package },
  { label: "Cleaner Logs", href: "/admin/cleaner-logs", icon: Footprints },
  {
    label: "Client Management",
    icon: ContactRound,
    children: [
      { label: "Client-Company", href: "/admin/user-management/client-companies" },
      { label: "Client-Contact", href: "/admin/user-management/clients" },
      { label: "Site Management", href: "/admin/user-management/sites" },
    ],
  },
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
      href={item.href ?? "#"}
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
      <span className="flex-1">{item.label}</span>
    </Link>
  );
}

interface SidebarNavGroupProps {
  item: NavItemConfig;
  pathname: string;
  onLinkClick?: () => void;
}

function SidebarNavGroup({ item, pathname, onLinkClick }: SidebarNavGroupProps) {
  const Icon = item.icon;
  const children = item.children ?? [];
  const isChildActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const groupActive = children.some((child) => isChildActive(child.href));

  // Collapsed by default; opens automatically when viewing one of its pages.
  const [expanded, setExpanded] = useState(groupActive);

  const submenuId = `submenu-${item.label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="flex flex-col">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={submenuId}
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
          groupActive ? "bg-white/10 text-white font-medium" : "text-white/70 hover:bg-white/10 font-normal",
        )}
      >
        <span className="flex items-center gap-3">
          <Icon size={20} strokeWidth={groupActive ? 2.5 : 1.75} aria-hidden="true" />
          {item.label}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={cn("shrink-0 transition-transform", expanded && "rotate-180")}
        />
      </button>

      {expanded && (
        <ul id={submenuId} className="mt-1 flex flex-col gap-1 pl-4">
          {children.map((child) => {
            const active = isChildActive(child.href);
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  aria-current={active ? "page" : undefined}
                  onClick={onLinkClick}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                    active ? "bg-[#ED5F25] text-white font-medium" : "text-white/60 hover:bg-white/10 font-normal",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn("h-1.5 w-1.5 shrink-0 rounded-full", active ? "bg-white" : "bg-white/40")}
                  />
                  {child.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const me = useMe();
  const logout = useLogout();

  // Clients don't get an Inspections view — supervisor/admin-only surface.
  // Supervisors get the Workforce & Management surfaces (Workforce, Client
  // Management, Cleaner Logs) in the admin console, alongside the cleaner app.
  const role = me.data?.role;
  const SUPERVISOR_ITEMS = new Set(["/admin/workforce", "/admin/cleaner-logs"]);
  const navItems =
    role === "SUPERVISOR"
      ? NAV_ITEMS.filter(
          (item) =>
            (item.href && SUPERVISOR_ITEMS.has(item.href)) ||
            item.label === "Client Management",
        )
      : role === "CLIENT"
        ? NAV_ITEMS.filter((item) => item.label !== "Inspections")
        : NAV_ITEMS;

  function isItemActive(item: NavItemConfig): boolean {
    if (!item.href) return false;
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
        {navItems.map((item) =>
          item.children ? (
            <SidebarNavGroup
              key={item.label}
              item={item}
              pathname={pathname}
              onLinkClick={onLinkClick}
            />
          ) : (
            <SidebarNavItem
              key={item.href}
              item={item}
              isActive={isItemActive(item)}
              onClick={onLinkClick}
            />
          ),
        )}
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
  const mobileOpen = useUIStore((s) => s.mobileNavOpen);
  const setMobileNav = useUIStore((s) => s.setMobileNav);

  // Close the drawer on Escape, and if the viewport is resized up to desktop
  // while it's open (avoids a stuck open drawer behind the persistent sidebar).
  useEffect(() => {
    if (!mobileOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileNav(false);
    }
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    function onViewportChange(e: MediaQueryListEvent) {
      if (e.matches) setMobileNav(false);
    }

    document.addEventListener("keydown", onKeyDown);
    desktopQuery.addEventListener("change", onViewportChange);

    // Prevent the page from scrolling behind the open drawer.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      desktopQuery.removeEventListener("change", onViewportChange);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Desktop sidebar — fixed off-flow; main is offset with lg:ml-64 */}
      <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-64 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileNav(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed bottom-0 left-0 top-0 z-50 w-64 max-w-[80vw] transform transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Mobile admin navigation"
        aria-hidden={!mobileOpen}
      >
        <div className="relative h-full">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileNav(false)}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <X size={18} aria-hidden="true" />
          </button>
          <SidebarContent onLinkClick={() => setMobileNav(false)} />
        </div>
      </aside>
    </>
  );
}
