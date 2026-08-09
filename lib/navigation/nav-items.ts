import {
  CalendarCheck,
  ClipboardCheck,
  ClipboardList,
  ContactRound,
  Footprints,
  Home,
  LayoutDashboard,
  MessageSquare,
  Package,
  User,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export interface NavChild {
  label: string;
  href: string;
}

export interface NavItemConfig {
  label: string;
  icon: LucideIcon;
  /** Leaf items link directly. */
  href?: string;
  /** Parent items expand/collapse a submenu instead of linking. */
  children?: NavChild[];
}

/**
 * Single merged nav config for the whole app. Only "Complaints" and
 * "Inventory" collapse the former cleaner/admin duplicates into one entry —
 * every other item keeps its existing route. Shown to every logged-in user
 * for now; role-based restriction is deferred to later work.
 */
export const NAV_ITEMS: NavItemConfig[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Tasks", href: "/dashboard/tasks", icon: ClipboardList },
  { label: "Profile", href: "/dashboard/profile", icon: User },
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Workforce", href: "/admin/workforce", icon: UsersRound },
  { label: "Inspections", href: "/admin/inspections", icon: ClipboardCheck },
  { label: "Complaints", href: "/admin/complaints", icon: MessageSquare },
  { label: "Inventory", href: "/admin/inventory", icon: Package },
  { label: "Cleaner Logs", href: "/admin/cleaner-logs", icon: Footprints },
  { label: "Client Site Management", href: "/admin/client-site-management", icon: CalendarCheck },
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

export const NAV_STYLE_THRESHOLD = 5;

export type NavLayoutStyle = "compact" | "full";

/** Compact (cleaner-style) nav below the threshold, full (admin-style) nav above it. */
export function getNavLayoutStyle(items: NavItemConfig[] = NAV_ITEMS): NavLayoutStyle {
  return items.length <= NAV_STYLE_THRESHOLD ? "compact" : "full";
}

export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === "/dashboard" || href === "/admin/dashboard") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(href + "/");
}
