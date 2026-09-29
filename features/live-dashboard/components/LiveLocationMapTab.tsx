"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { LiveLocationMap } from "./LiveLocationMap";
import { SEGMENT_BTN } from "./PersonScheduleTab";

type Audience = "cleaners" | "supervisors";

/** Live map with a toggle between the cleaners map and the supervisors map. */
export function LiveLocationMapTab() {
  const [audience, setAudience] = useState<Audience>("cleaners");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex overflow-hidden self-start rounded-xl border border-grey-200">
        <button
          type="button"
          onClick={() => setAudience("cleaners")}
          className={cn(
            SEGMENT_BTN,
            audience === "cleaners" ? "bg-primary text-white" : "text-on-surface hover:bg-grey-100",
          )}
        >
          Cleaners
        </button>
        <button
          type="button"
          onClick={() => setAudience("supervisors")}
          className={cn(
            SEGMENT_BTN,
            audience === "supervisors" ? "bg-primary text-white" : "text-on-surface hover:bg-grey-100",
          )}
        >
          Supervisors
        </button>
      </div>

      <LiveLocationMap key={audience} audience={audience} />
    </div>
  );
}
