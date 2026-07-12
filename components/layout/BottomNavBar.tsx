"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ClipboardList,
  MessageSquare,
  Package,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

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

export function BottomNavBar() {
  const pathname = usePathname();

  function isItemActive(item: NavItemConfig): boolean {
    if (item.href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(item.href);
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

        {NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.href}
            item={item}
            isActive={isItemActive(item)}
          />
        ))}
      </nav>

      {/* Mobile / tablet bottom bar — hidden on lg+ screens */}
      <nav
        aria-label="Main navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center border-t border-grey-300 bg-surface"
      >
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={isItemActive(item)}
          />
        ))}
      </nav>
    </>
  );
}
