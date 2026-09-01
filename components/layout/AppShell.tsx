"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useUIStore } from "@/store/ui.store";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { AppNav, useIsDrawerNav, sectionTitle } from "@/components/layout/AppNav";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Single shell wrapping every authenticated page — desktop sidebar / mobile
 * bottom-bar-or-drawer nav (see AppNav), plus the shared title+bell top bar.
 * The bar always shows on desktop; on mobile it only shows when the nav is in
 * drawer mode (>5 items) — when the nav has ≤5 items, mobile uses the
 * cleaner-style bottom tab bar instead, and each page renders its own green
 * PageHeader there rather than this bar.
 */
export function AppShell({ children }: AppShellProps) {
  const setMobileNav = useUIStore((s) => s.setMobileNav);
  const headerAction = useUIStore((s) => s.headerAction);
  const pathname = usePathname();
  const title = sectionTitle(pathname);
  const useDrawerNav = useIsDrawerNav();

  return (
    <div className="min-h-screen bg-surface-muted">
      <AppNav />

      <div className="lg:pl-64">
        <header
          className={cn(
            "sticky top-0 z-30 h-16 shrink-0 items-center gap-3 bg-surface-muted px-4 lg:flex lg:px-8",
            useDrawerNav ? "flex" : "hidden",
          )}
        >
          {useDrawerNav && (
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
            {headerAction && (
              <button
                type="button"
                onClick={headerAction.onClick}
                aria-label={headerAction.label}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-grey-600 transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <headerAction.icon size={20} aria-hidden="true" />
              </button>
            )}
            <NotificationBell />
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
