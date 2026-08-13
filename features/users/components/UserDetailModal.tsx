"use client";

import { Mail, Phone, Building2, MapPin, CalendarDays, Loader2, BadgeCheck } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { UserDocumentsSection } from "@/features/users/components/UserDocumentsSection";
import { useUserDetail } from "@/features/users/hooks/useUserDetail";
import { ROLE_LABELS, type User } from "@/features/users/schemas/user.schema";
import { SITE_TYPE_LABELS, type SiteType } from "@/features/user-management/schemas/site.schema";

interface UserDetailModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

function fullName(first?: string | null, last?: string | null): string {
  return [first, last].filter(Boolean).join(" ").trim() || "Unnamed";
}

function formatDob(value?: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
}

function siteTypeLabel(value?: string | null): string {
  if (!value) return "Site";
  return SITE_TYPE_LABELS[value as SiteType] ?? "Site";
}

export function UserDetailModal({ open, onClose, user }: UserDetailModalProps) {
  const detailQuery = useUserDetail(open ? user?.id : undefined);
  const detail = detailQuery.data;
  const roleLabel = detail ? ROLE_LABELS[detail.role] : user ? ROLE_LABELS[user.role] : "Profile";
  const dob = formatDob(detail?.dateOfBirth);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${roleLabel} profile`}
      description="Personal details, compliance documents and assigned sites."
      maxWidthClassName="max-w-3xl"
    >
      {detailQuery.isLoading ? (
        <div className="flex justify-center py-12 text-grey-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : detailQuery.isError || !detail ? (
        <p className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
          Failed to load profile.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Identity */}
          <div className="flex items-center gap-4">
            <UserAvatar
              userId={detail.id}
              hasPhoto={detail.hasPhoto}
              version={detail.updatedAt}
              firstName={detail.firstName}
              lastName={detail.lastName}
              size={64}
            />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-on-surface">
                {fullName(detail.firstName, detail.lastName)}
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-grey-500">
                <BadgeCheck className="h-3.5 w-3.5" /> {roleLabel}
              </span>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-grey-600">
                {detail.email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-4 w-4" /> {detail.email}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-4 w-4" /> {detail.phoneNumber ?? "—"}
                </span>
                {dob && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" /> DOB {dob}
                  </span>
                )}
              </div>
              <div className="mt-2">
                {detail.active ? (
                  detail.setupComplete ? (
                    <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                      Active
                    </span>
                  ) : (
                    <span className="rounded-full bg-status-pending/10 px-2.5 py-0.5 text-xs font-medium text-status-pending">
                      Pending setup
                    </span>
                  )
                ) : (
                  <span className="rounded-full bg-grey-100 px-2.5 py-0.5 text-xs font-medium text-grey-700">
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Assigned sites */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-on-surface">
              Assigned sites ({detail.sites.length})
            </h3>
            {detail.sites.length === 0 ? (
              <p className="rounded-xl border border-dashed border-grey-200 px-3 py-6 text-center text-sm text-grey-500">
                Not assigned to any site yet.
              </p>
            ) : (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {detail.sites.map((site) => (
                  <li key={site.siteId} className="rounded-xl border border-grey-200 p-3">
                    <p className="flex items-center gap-2 text-sm font-medium text-on-surface">
                      <MapPin className="h-4 w-4 text-grey-400" /> {site.siteName}
                    </p>
                    <div className="mt-1 flex flex-col gap-0.5 text-xs text-grey-500">
                      {(site.clientName || site.clientCompanyName) && (
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {[site.clientName, site.clientCompanyName].filter(Boolean).join(" · ")}
                        </span>
                      )}
                      <span>
                        {siteTypeLabel(site.siteType)}
                        {site.slotLabel ? ` · Assigned as ${site.slotLabel}` : ""}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Documents */}
          <div className="border-t border-grey-100 pt-4">
            <UserDocumentsSection userId={detail.id} />
          </div>
        </div>
      )}
    </Modal>
  );
}
