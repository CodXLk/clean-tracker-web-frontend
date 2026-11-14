"use client";

import { isAdminRole } from "@/lib/auth/roles";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useMe } from "@/features/auth/hooks/useMe";
import { AnnouncementManagement } from "@/features/announcements/components/AnnouncementManagement";

export default function AnnouncementsPage() {
  const { data: me, isLoading } = useMe();

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-sm text-grey-500">
            Send announcements to staff. They arrive as a push notification on their phones and in their notifications.
          </p>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : isAdminRole(me?.role) ? (
          <AnnouncementManagement />
        ) : (
          <div className="rounded-2xl bg-surface p-6 text-sm text-grey-500 shadow-sm">
            Only administrators and client service managers can send announcements.
          </div>
        )}
      </div>
    </div>
  );
}
