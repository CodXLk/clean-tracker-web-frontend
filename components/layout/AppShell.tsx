"use client";

import { getNavLayoutStyle } from "@/lib/navigation/nav-items";
import { CompactNav } from "@/components/layout/CompactNav";
import { FullNavSidebar } from "@/components/layout/FullNavSidebar";
import { FullNavTopBar } from "@/components/layout/FullNavTopBar";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Picks the cleaner-style compact nav or the admin-style full nav based on
 * the merged nav item count — see lib/navigation/nav-items.ts.
 */
export function AppShell({ children }: AppShellProps) {
  const style = getNavLayoutStyle();

  if (style === "compact") {
    return (
      <div className="lg:pl-64">
        {children}
        <CompactNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFB] lg:flex-row">
      <FullNavSidebar />
      <main className="flex min-h-screen min-w-0 flex-1 flex-col overflow-auto lg:ml-64">
        <FullNavTopBar />
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
