"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { ModalPortal } from "@/components/shared/ModalPortal";
import { useAssignmentAlerts } from "@/features/assignment-approvals/hooks/useAssignmentApprovals";

/** Management high-alert popup: sites/work orders that started while still unaccepted or unmanned. */
export function AssignmentAlertsModal({ enabled }: { enabled: boolean }) {
  const { data: alerts = [] } = useAssignmentAlerts(enabled);
  const [dismissed, setDismissed] = useState(false);

  if (!enabled || dismissed || alerts.length === 0) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-danger" aria-hidden />
              <h2 className="text-base font-semibold text-on-surface">Staffing alert</h2>
            </div>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setDismissed(true)}
              className="rounded-full p-1 text-grey-400 hover:bg-grey-100 hover:text-ink"
            >
              <X size={18} />
            </button>
          </div>
          <p className="mb-3 text-sm text-grey-600">
            {alerts.length} slot{alerts.length > 1 ? "s" : ""} started without confirmed staff:
          </p>
          <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {alerts.map((a) => (
              <li
                key={`${a.type}-${a.profileId}`}
                className="rounded-xl border border-danger/30 bg-danger/5 px-3 py-2"
              >
                <p className="text-sm font-medium text-on-surface">
                  {a.label} · {a.locationName}
                </p>
                <p className="text-xs text-danger">
                  {a.reason === "UNASSIGNED"
                    ? "No one assigned"
                    : `${a.personName ?? "Assignee"} hasn't accepted`}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ModalPortal>
  );
}
