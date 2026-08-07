"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface NotificationsModalProps {
  open:    boolean;
  onClose: () => void;
}

interface NotificationRow {
  id:    string;
  label: string;
}

const NOTIFICATION_ROWS: NotificationRow[] = [
  { id: "inApp", label: "In app" },
  { id: "email", label: "Email"  },
];

export function NotificationsModal({ open, onClose }: NotificationsModalProps) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    inApp: true,
    email: false,
  });

  if (!open) return null;

  function toggle(id: string) {
    setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Notifications settings"
        className={cn(
          "fixed z-50 bg-white p-6",
          "inset-x-0 bottom-0 rounded-t-3xl min-h-[50vh] max-h-[85vh] overflow-y-auto",
          "lg:inset-0 lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:min-h-0 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-md lg:rounded-3xl lg:shadow-2xl",
        )}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-on-surface">Notifications</h2>
          <button
            onClick={onClose}
            aria-label="Close notifications"
            className="rounded-full p-0.5 text-danger transition-colors hover:bg-danger/10"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Notification rows */}
        <div className="flex flex-col gap-3">
          {NOTIFICATION_ROWS.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between rounded-2xl bg-white px-4 py-4 shadow-sm"
            >
              <span className="text-sm font-medium text-on-surface">{row.label}</span>

              {/* Toggle switch */}
              <label
                htmlFor={`toggle-${row.id}`}
                className="relative inline-flex cursor-pointer items-center"
              >
                <input
                  id={`toggle-${row.id}`}
                  type="checkbox"
                  role="switch"
                  aria-checked={enabled[row.id] ?? false}
                  checked={enabled[row.id] ?? false}
                  onChange={() => toggle(row.id)}
                  className="sr-only peer"
                />
                <div
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors duration-200",
                    enabled[row.id] ? "bg-primary" : "bg-grey-300",
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
                      enabled[row.id] && "translate-x-5",
                    )}
                  />
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
