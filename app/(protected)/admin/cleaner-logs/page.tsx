import { Suspense } from "react";
import { CleanerLogsView } from "@/features/attendance/components/CleanerLogsView";

export default function CleanerLogsPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-sm text-grey-500">
            Check-in and check-out records with NFC or location validation, and time worked per site and type.
          </p>
        </div>
        <Suspense fallback={null}>
          <CleanerLogsView />
        </Suspense>
      </div>
    </div>
  );
}
