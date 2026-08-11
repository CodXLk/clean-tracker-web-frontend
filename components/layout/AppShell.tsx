"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useUIStore } from "@/store/ui.store";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { AppNav, USE_DRAWER_NAV, hasMobileOnlyHeader, sectionTitle } from "@/components/layout/AppNav";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Single shell wrapping every authenticated page — desktop sidebar / mobile
 * bottom-bar-or-drawer nav (see AppNav), plus a top bar that only appears
 * where a page needs one: routes with their own in-page PageHeader (Home,
 * Tasks, Profile) get just a floating drawer trigger; routes without one
 * (the rest of the merged nav) get the title+bell bar the admin console
 * used to render itself.
 */
export function AppShell({ children }: AppShellProps) {
  const setMobileNav = useUIStore((s) => s.setMobileNav);
  const pathname = usePathname();
  const title = sectionTitle(pathname);
  const mobileOnlyHeader = hasMobileOnlyHeader(pathname);

  // Drawer trigger floats independently of the title bar whenever the
  // current route hides that bar on mobile (no title at all, or a page that
  // already renders its own PageHeader there) — otherwise it lives inside
  // the bar itself, like the admin console's top bar always did.
  const floatingTrigger = USE_DRAWER_NAV && (!title || mobileOnlyHeader);

  return (
    <div className="min-h-screen bg-[#F8FAFB]">
      <AppNav />

      <div className="lg:pl-64">
        {title && (
          <header
            className={cn(
              "sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 bg-[#F8FAFB] px-4 lg:px-8",
              mobileOnlyHeader && "hidden lg:flex",
            )}
          >
            {USE_DRAWER_NAV && !mobileOnlyHeader && (
              <button
                type="button"
                aria-label="Open navigation"
                onClick={() => setMobileNav(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
              >
                <Menu size={20} aria-hidden="true" />
              </button>
            )}
            <h1 className="min-w-0 flex-1 truncate text-xl font-bold text-on-surface lg:text-2xl">
              {title}
            </h1>
            <div className="flex shrink-0 items-center gap-1">
              <NotificationBell />
            </div>
          </header>
        )}

        {floatingTrigger && (
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setMobileNav(true)}
            className="fixed left-4 top-4 z-[60] flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
        )}

        {children}
      </div>
    </div>
  );
}
