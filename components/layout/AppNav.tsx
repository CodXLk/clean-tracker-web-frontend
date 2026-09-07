"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  ContactRound,
  Footprints,
  Handshake,
  Home,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MessageSquare,
  MoreVertical,
  Package,
  PackageCheck,
  Repeat,
  User,
  Users,
  UsersRound,
  CalendarCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useMe } from "@/features/auth/hooks/useMe";
import { useLogout } from "@/features/auth/hooks/useAuth";
import { useClientPortalSites } from "@/features/user-management/hooks/useSites";
import { useUIStore } from "@/store/ui.store";
import { ROLE_LABELS } from "@/features/users/schemas/user.schema";
import { SUPERVISOR_ALLOWED_HREFS } from "@/lib/auth/roles";

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

/**
 * Merged nav — union of the old cleaner and admin nav lists. "Complaints" and
 * "Inventory" are the only items that existed under the same name in both, so
 * they collapse into a single entry pointing at the merged page. Everything
 * else is shown to every authenticated user for now; role-based trimming is
 * deferred to later work.
 */
const NAV_ITEMS: NavItemConfig[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Tasks", href: "/dashboard/tasks", icon: ClipboardList },
  { label: "Inspections", href: "/dashboard/inspections", icon: ListChecks },
  { label: "Complaints", href: "/admin/complaints", icon: MessageSquare },
  { label: "Inventory", href: "/admin/inventory", icon: Package },
  { label: "Item Requests", href: "/admin/item-requests", icon: PackageCheck },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Workforce Management", href: "/admin/workforce", icon: UsersRound },
  { label: "Outsource Projects", href: "/admin/outsource", icon: Handshake },
  { label: "Inspections Dashboard", href: "/admin/inspections", icon: ClipboardCheck },
  { label: "Cleaner Logs", href: "/admin/cleaner-logs", icon: Footprints },
  { label: "Client Site Management", href: "/admin/client-site-management", icon: CalendarCheck },
  {
    label: "Client Management",
    icon: ContactRound,
    children: [
      { label: "Client-Company", href: "/admin/user-management/client-companies" },
      { label: "Client-Contact", href: "/admin/user-management/clients" },
    ],
  },
  { label: "Profile", href: "/dashboard/profile", icon: User },
];

/** Cleaner role sees a minimal 5-item nav (Home, Tasks, Complaints, Inventory,
 *  Profile) — everyone else still sees the full merged list for now, until
 *  their own restriction is defined. */
const CLEANER_HREFS = new Set([
  "/dashboard",
  "/dashboard/tasks",
  "/admin/complaints",
  "/admin/inventory",
  "/dashboard/profile",
]);
const CLEANER_NAV_ITEMS: NavItemConfig[] = NAV_ITEMS.filter(
  (item) => item.href && CLEANER_HREFS.has(item.href),
);

/** Super admins don't need the cleaner-facing Home page or the cleaner Tasks tab (task
 *  completion is a cleaner activity); Inspections stay since they're surfaced in the Admin Panel. */
const SUPER_ADMIN_HIDDEN_HREFS = new Set(["/dashboard", "/dashboard/tasks"]);
const SUPER_ADMIN_NAV_ITEMS: NavItemConfig[] = NAV_ITEMS.filter(
  (item) => !item.href || !SUPER_ADMIN_HIDDEN_HREFS.has(item.href),
);

/** Supervisors get a fixed subset of the Admin Panel — kept in sync with proxy.ts,
 *  which also enforces this at the route level (see SUPERVISOR_ALLOWED_HREFS). */
const SUPERVISOR_HREFS = new Set<string>(SUPERVISOR_ALLOWED_HREFS);
const SUPERVISOR_NAV_ITEMS: NavItemConfig[] = NAV_ITEMS.filter(
  (item) => item.href && SUPERVISOR_HREFS.has(item.href),
);

/** Clients see a minimal nav: Dashboard, Complaints, Workforce, Profile — plus the
 *  Client Site Management tab only when they have a site with that view enabled. */
const CLIENT_BASE_HREFS = [
  "/admin/dashboard",
  "/admin/complaints",
  "/admin/workforce",
  "/admin/item-requests",
  "/dashboard/profile",
];
const CLIENT_PORTAL_HREF = "/admin/client-site-management";
const CLIENT_NAV_ITEMS: NavItemConfig[] = NAV_ITEMS.filter(
  (item) => item.href && CLIENT_BASE_HREFS.includes(item.href),
);
const CLIENT_NAV_ITEMS_WITH_PORTAL: NavItemConfig[] = NAV_ITEMS.filter(
  (item) => item.href && (CLIENT_BASE_HREFS.includes(item.href) || item.href === CLIENT_PORTAL_HREF),
);

/** Everyone who isn't a client (e.g. company admin) sees the full admin nav, including the
 *  Client Site Management view (management sees every site there). The cleaner Tasks tab is
 *  excluded — task completion is a cleaner-only activity. */
const NON_CLIENT_NAV_ITEMS: NavItemConfig[] = NAV_ITEMS.filter(
  (item) => item.href !== "/dashboard/tasks",
);

/** The nav items visible to the current user, based on role. */
function useVisibleNavItems(): NavItemConfig[] {
  const { data: me } = useMe();
  const isClient = me?.role === "CLIENT";
  const portalSites = useClientPortalSites(isClient);
  const hasClientPortal = (portalSites.data?.length ?? 0) > 0;

  if (me?.role === "CLEANER") return CLEANER_NAV_ITEMS;
  if (me?.role === "SUPER_ADMIN") return SUPER_ADMIN_NAV_ITEMS;
  if (me?.role === "CLIENT") return hasClientPortal ? CLIENT_NAV_ITEMS_WITH_PORTAL : CLIENT_NAV_ITEMS;
  if (me?.role === "SUPERVISOR") return SUPERVISOR_NAV_ITEMS;
  return NON_CLIENT_NAV_ITEMS;
}

/** Whether the mobile experience shows the cleaner-style bottom bar (≤5 items)
 *  or the admin-style hamburger + drawer (>5 items), for the current user. */
export function useIsDrawerNav(): boolean {
  return useVisibleNavItems().length > 5;
}

/** Ordered most-specific first so longest-prefix wins. Every route resolves a
 *  title now — the shared top bar shows everywhere (see AppShell); pages only
 *  add their own green PageHeader on mobile when useIsDrawerNav() is false. */
const SECTION_TITLES: ReadonlyArray<readonly [string, string]> = [
  ["/admin/user-management/client-companies", "Client-Company Management"],
  ["/admin/user-management/clients", "Client-Contact"],
  ["/admin/user-management/sites", "Site Management"],
  ["/admin/dashboard", "Dashboard"],
  ["/admin/users", "Users"],
  ["/admin/cleaner-management", "Cleaner Management"],
  ["/admin/companies", "Client Companies"],
  ["/admin/workforce", "Workforce Management"],
  ["/admin/outsource", "Outsource Projects"],
  ["/admin/inspections", "Inspections Dashboard"],
  ["/admin/complaints", "Complaints"],
  ["/admin/inventory", "Inventory"],
  ["/admin/item-requests", "Item Requests"],
  ["/admin/client-site-management", "Client Site Management"],
  ["/admin/cleaner-logs", "Cleaner Logs"],
  ["/admin/notifications", "Notifications"],
  ["/dashboard/tasks", "Tasks"],
  ["/dashboard/inspections", "Inspections"],
  ["/dashboard/profile", "Profile"],
  ["/dashboard/notifications", "Notifications"],
  ["/dashboard", "Home"],
];

export function sectionTitle(pathname: string): string {
  const match = SECTION_TITLES.find(
    ([path]) => pathname === path || pathname.startsWith(`${path}/`),
  );
  return match?.[1] ?? "";
}

function isItemActive(item: NavItemConfig, pathname: string): boolean {
  if (!item.href) return false;
  if (item.href === "/dashboard") return pathname === "/dashboard";
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

/* ------------------------------------------------------------------ */
/* Mobile bottom tab bar (cleaner style) — used when NAV_ITEMS.length <= 5 */
/* ------------------------------------------------------------------ */

function BottomBarItem({ item, isActive }: { item: NavItemConfig; isActive: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href ?? "#"}
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
          isActive ? "font-semibold text-ink" : "font-medium text-nav-icon-inactive",
        )}
      >
        {item.label}
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Desktop sidebar / mobile drawer (admin style) */
/* ------------------------------------------------------------------ */

function SidebarNavItem({
  item,
  isActive,
  onClick,
}: {
  item: NavItemConfig;
  isActive: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href ?? "#"}
      aria-current={isActive ? "page" : undefined}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-2/40",
        isActive ? "bg-brand-2 text-white font-medium" : "text-body-2 hover:bg-surface-muted font-normal",
      )}
    >
      <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} aria-hidden="true" />
      <span className="flex-1">{item.label}</span>
    </Link>
  );
}

function SidebarNavGroup({
  item,
  pathname,
  onLinkClick,
}: {
  item: NavItemConfig;
  pathname: string;
  onLinkClick?: () => void;
}) {
  const Icon = item.icon;
  const children = item.children ?? [];
  const isChildActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const groupActive = children.some((child) => isChildActive(child.href));
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
          "flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-2/40",
          groupActive ? "bg-surface-muted text-ink font-medium" : "text-body-2 hover:bg-surface-muted font-normal",
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
                    "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-2/40",
                    active ? "bg-brand-2 text-white font-medium" : "text-body-2 hover:bg-surface-muted font-normal",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn("h-1.5 w-1.5 shrink-0 rounded-full", active ? "bg-white" : "bg-line-2")}
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
  const items = useVisibleNavItems();
  const [menuOpen, setMenuOpen] = useState(false);

  const fullName = me.data
    ? [me.data.firstName, me.data.lastName].filter(Boolean).join(" ")
    : "…";
  const initial = (me.data?.firstName ?? "?").charAt(0).toUpperCase();
  const canSwitchRole = (me.data?.roles?.length ?? 0) > 1;

  function handleLogout() {
    logout.mutate(undefined, { onSettled: () => router.replace("/login") });
  }

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className="flex h-full flex-col border-r border-line bg-white">
      <div className="flex items-center gap-3 px-4 pb-4 pt-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface-muted">
          <Image
            src="/images/marketing/brand/logomark.png"
            alt="Primeway"
            width={40}
            height={40}
            className="h-8 w-8 object-contain"
            priority
          />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-base font-bold text-ink">Primeway</p>
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-body-2">
            Cleaning Management
          </p>
        </div>
      </div>

      <nav
        aria-label="Main navigation"
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 pb-2"
      >
        {items.map((item) =>
          item.children ? (
            <SidebarNavGroup key={item.label} item={item} pathname={pathname} onLinkClick={onLinkClick} />
          ) : (
            <SidebarNavItem
              key={item.href}
              item={item}
              isActive={isItemActive(item, pathname)}
              onClick={onLinkClick}
            />
          ),
        )}
      </nav>

      <div className="mt-auto border-t border-line px-4 py-4">
        <div className="flex items-center gap-3">
          {me.data ? (
            <UserAvatar
              userId={me.data.id}
              hasPhoto={me.data.hasPhoto}
              version={me.data.updatedAt}
              firstName={me.data.firstName}
              lastName={me.data.lastName}
              size={32}
            />
          ) : (
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-2 text-sm font-semibold text-white"
              aria-hidden="true"
            >
              {initial}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{fullName}</p>
            <p className="text-xs text-body-2">{me.data ? ROLE_LABELS[me.data.role] : ""}</p>
          </div>
          {canSwitchRole ? (
            <div className="relative">
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    aria-hidden="true"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div
                    role="menu"
                    className="absolute bottom-full right-0 z-50 mb-2 w-48 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-lg"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        router.push("/select-role");
                      }}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-ink transition-colors hover:bg-surface-muted"
                    >
                      <Repeat size={15} aria-hidden="true" className="shrink-0" />
                      Switch role
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        handleLogout();
                      }}
                      disabled={logout.isPending}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-danger transition-colors hover:bg-danger/10 disabled:opacity-60"
                    >
                      <LogOut size={15} aria-hidden="true" className="shrink-0" />
                      {logout.isPending ? "Signing out…" : "Sign out"}
                    </button>
                  </div>
                </>
              )}
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Account menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-body-2 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-2/40"
              >
                <MoreVertical size={16} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              disabled={logout.isPending}
              aria-label="Sign out"
              title="Sign out"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-body-2 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-2/40 disabled:opacity-50"
            >
              <LogOut size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DesktopSidebar() {
  return (
    <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-64 shadow-lg ring-1 ring-black/5 lg:block">
      <SidebarContent />
    </aside>
  );
}

function MobileDrawer() {
  const mobileOpen = useUIStore((s) => s.mobileNavOpen);
  const setMobileNav = useUIStore((s) => s.setMobileNav);

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

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      desktopQuery.removeEventListener("change", onViewportChange);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen, setMobileNav]);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileNav(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed bottom-0 left-0 top-0 z-50 w-64 max-w-[80vw] transform transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Mobile navigation"
        aria-hidden={!mobileOpen}
      >
        <div className="relative h-full">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileNav(false)}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-body-2 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-2/40"
          >
            <X size={18} aria-hidden="true" />
          </button>
          <SidebarContent onLinkClick={() => setMobileNav(false)} />
        </div>
      </aside>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Public component */
/* ------------------------------------------------------------------ */

export function AppNav() {
  const pathname = usePathname();
  const items = useVisibleNavItems();
  const useDrawerNav = items.length > 5;

  return (
    <>
      {/* Desktop: always the fixed admin-style sidebar */}
      <DesktopSidebar />

      {useDrawerNav ? (
        <MobileDrawer />
      ) : (
        // Cleaner-style bottom tab bar — shown once the current user's nav has
        // ≤5 items (e.g. the CLEANER role). Desktop's sidebar (above) already
        // provides logout, so this needs no footer.
        <nav
          aria-label="Main navigation"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center border-t border-grey-300 bg-surface"
        >
          {items.filter((i) => i.href).map((item) => (
            <BottomBarItem key={item.href} item={item} isActive={isItemActive(item, pathname)} />
          ))}
        </nav>
      )}
    </>
  );
}

export { NAV_ITEMS };
export type { NavItemConfig };
