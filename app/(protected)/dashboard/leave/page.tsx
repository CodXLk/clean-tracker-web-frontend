"use client";

import { useIsDrawerNav } from "@/components/layout/AppNav";
import { LeaveStaffSection } from "@/features/leave/components/LeaveStaffSection";
import { cn } from "@/lib/utils/cn";

export default function LeavePage() {
  const useDrawerNav = useIsDrawerNav();

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at top left, rgba(71,114,115,0.18) 0%, transparent 60%), #F5F5F5",
      }}
    >
      {!useDrawerNav && (
        <div className="lg:hidden">
          <header className="bg-primary rounded-b-[40px] px-5 pt-8 pb-8 mb-5">
            <div className="mx-auto flex max-w-2xl items-center gap-3 lg:max-w-5xl">
              <div className="flex-1">
                <h1 className="text-2xl font-semibold leading-tight text-white">Leave</h1>
                <p className="text-xs text-white/70">Request time off and manage covers</p>
              </div>
            </div>
          </header>
        </div>
      )}

      <main
        className={cn(
          "mx-auto max-w-2xl px-5 pb-28 lg:max-w-5xl",
          !useDrawerNav ? "pt-5 -mt-5" : "pt-5",
        )}
      >
        <LeaveStaffSection />
      </main>
    </div>
  );
}
