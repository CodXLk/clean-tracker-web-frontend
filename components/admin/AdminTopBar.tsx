"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useUIStore } from "@/store/ui.store";
import { NotificationBell } from "./NotificationBell";

/** Ordered most-specific first so longest-prefix wins. */
const SECTION_TITLES: ReadonlyArray<readonly [string, string]> = [
  ["/admin/user-management/client-companies", "Client-Company Management"],
  ["/admin/user-management/clients", "Client-Contact"],
  ["/admin/user-management/sites", "Site Management"],
  ["/admin/dashboard", "Dashboard"],
  ["/admin/users", "Users"],
  ["/admin/companies", "Client Companies"],
  ["/admin/workforce", "Workforce & Management"],
  ["/admin/inspections", "Inspections"],
  ["/admin/complaints", "Complaints"],
  ["/admin/inventory", "Inventory"],
  ["/admin/cleaner-logs", "Cleaner Logs"],
  ["/admin/notifications", "Notifications"],
];

function sectionTitle(pathname: string): string {
  const match = SECTION_TITLES.find(
    ([path]) => pathname === path || pathname.startsWith(`${path}/`),
  );
  return match?.[1] ?? "";
}

export function AdminTopBar() {
  const setMobileNav = useUIStore((s) => s.setMobileNav);
  const pathname = usePathname();
  const title = sectionTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 bg-[#F8FAFB] px-4 lg:px-8">
      {/* Mobile: open the navigation drawer */}
      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => setMobileNav(true)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      {/* Current section name */}
      <h1 className="min-w-0 flex-1 truncate text-xl font-bold text-on-surface lg:text-2xl">
        {title}
      </h1>

      {/* Right-aligned utilities */}
      <div className="flex shrink-0 items-center gap-1">
        <NotificationBell />
      </div>
    </header>
  );
}
