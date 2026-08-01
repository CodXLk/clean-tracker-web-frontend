import { AttendanceLogsTable } from "@/features/attendance/components/AttendanceLogsTable";

export default function CleanerLogsPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-on-surface">Cleaner Logs</h1>
          <p className="text-sm text-grey-500">
            Check-in and check-out records with NFC or location validation.
          </p>
        </div>
        <AttendanceLogsTable />
      </div>
    </div>
  );
}
