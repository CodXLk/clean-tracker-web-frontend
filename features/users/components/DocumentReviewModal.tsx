"use client";

import { PanelOrModal } from "@/components/shared/PanelOrModal";
import { UserDocumentsSection } from "@/features/users/components/UserDocumentsSection";
import { useUserDetail } from "@/features/users/hooks/useUserDetail";
import { ROLE_LABELS } from "@/features/users/schemas/user.schema";

interface DocumentReviewModalProps {
  /** The user whose compliance documents to review; null keeps the modal closed. */
  userId: string | null;
  onClose: () => void;
}

/**
 * Standalone compliance-document review modal used for notification deep-links, where only a
 * user id is known. Loads the person's name/role for the header and lists their documents to verify.
 */
export function DocumentReviewModal({ userId, onClose }: DocumentReviewModalProps) {
  const open = !!userId;
  const detail = useUserDetail(userId ?? undefined, open);
  const u = detail.data;
  const name = u ? [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || "" : "";
  const roleLabel = u ? ROLE_LABELS[u.role] : "";

  return (
    <PanelOrModal
      open={open}
      onClose={onClose}
      title="Compliance documents"
      description={name ? `${roleLabel} · ${name}` : "Review and verify certificates."}
      maxWidthClassName="max-w-3xl"
    >
      {userId && <UserDocumentsSection userId={userId} />}
    </PanelOrModal>
  );
}
