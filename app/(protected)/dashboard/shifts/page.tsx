"use client";

import { Suspense } from "react";
import { useIsDrawerNav } from "@/components/layout/AppNav";
import { MyShiftsSection } from "@/features/shifts/components/MyShiftsSection";
import { UpcomingShiftsSection } from "@/features/shifts/components/UpcomingShiftsSection";
import { cn } from "@/lib/utils/cn";

export default function ShiftsPage() {
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
                <h1 className="text-2xl font-semibold leading-tight text-white">My shifts</h1>
                <p className="text-xs text-white/70">Your approved shifts per site and change requests</p>
              </div>
            </div>
          </header>
        </div>
      )}

      <main className={cn("mx-auto flex max-w-2xl flex-col gap-4 px-5 pb-28 lg:max-w-5xl", !useDrawerNav ? "pt-5 -mt-5" : "pt-5")}>
        <Suspense fallback={null}>
          <UpcomingShiftsSection />
        </Suspense>
        <MyShiftsSection />
      </main>
    </div>
  );
}
