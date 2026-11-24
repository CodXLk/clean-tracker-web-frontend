"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useMe } from "@/features/auth/hooks/useMe";
import { usePushPreferences, useUpdatePushPreferences } from "@/features/notifications/hooks/useNotifications";
import type { PushPreference } from "@/features/notifications/schemas/notification.schema";

interface NotificationsModalProps {
  open:    boolean;
  onClose: () => void;
}

/**
 * Notification settings: which categories are pushed to the user's phone (Primeway mobile app).
 * The backend only lists categories relevant to the signed-in role (e.g. clients only get complaint
 * updates; admins get no shift/task/leave-cover pushes). In-app notifications are always kept.
 */
export function NotificationsModal({ open, onClose }: NotificationsModalProps) {
  const role = useMe().data?.role;
  const prefs = usePushPreferences(role, open);
  const update = useUpdatePushPreferences(role);

  if (!open) return null;

  function toggle(pref: PushPreference) {
    if (pref.mandatory || !prefs.data) return;
    const muted = prefs.data
      .filter((p) => !p.mandatory && (p.category === pref.category ? p.enabled : !p.enabled))
      .map((p) => p.category);
    update.mutate(muted);
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
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xl font-bold text-on-surface">Notifications</h2>
          <button
            onClick={onClose}
            aria-label="Close notifications"
            className="rounded-full p-0.5 text-danger transition-colors hover:bg-danger/10"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>
        <p className="mb-5 text-sm text-grey-500">
          Choose which notifications are sent to your phone through the Primeway mobile app.
        </p>

        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-grey-500">Send to my phone</p>

        {prefs.isLoading ? (
          <div className="flex justify-center py-6">
            <LoadingSpinner />
          </div>
        ) : prefs.isError ? (
          <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
            Couldn&apos;t load your notification settings.
          </p>
        ) : (prefs.data ?? []).length === 0 ? (
          <p className="px-1 text-sm text-grey-500">There are no phone notifications for your role.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {(prefs.data ?? []).map((pref) => (
              <div
                key={pref.category}
                className="flex items-center justify-between rounded-2xl bg-white px-4 py-4 shadow-sm"
              >
                <div className="pr-3">
                  <span className="text-sm font-medium text-on-surface">{pref.label}</span>
                  {pref.mandatory && <p className="mt-0.5 text-xs text-grey-500">Always on</p>}
                </div>

                {/* Toggle switch */}
                <label
                  htmlFor={`toggle-${pref.category}`}
                  className={cn(
                    "relative inline-flex shrink-0 items-center",
                    pref.mandatory || update.isPending ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                  )}
                >
                  <input
                    id={`toggle-${pref.category}`}
                    type="checkbox"
                    role="switch"
                    aria-checked={pref.enabled}
                    aria-label={pref.label}
                    checked={pref.enabled}
                    disabled={pref.mandatory || update.isPending}
                    onChange={() => toggle(pref)}
                    className="sr-only peer"
                  />
                  <div
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors duration-200",
                      pref.enabled ? "bg-primary" : "bg-grey-300",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
                        pref.enabled && "translate-x-5",
                      )}
                    />
                  </div>
                </label>
              </div>
            ))}
          </div>
        )}

        {update.isError && (
          <p role="alert" className="mt-3 rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
            Couldn&apos;t save that change. Please try again.
          </p>
        )}

        <p className="mt-4 px-1 text-xs text-grey-500">
          Everything still appears in your in-app notifications.
        </p>
      </div>
    </>
  );
}
