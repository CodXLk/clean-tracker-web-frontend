"use client";

import { PanelOrModal } from "@/components/shared/PanelOrModal";
import { UserDocumentsSection } from "@/features/users/components/UserDocumentsSection";
import { ROLE_LABELS, type User } from "@/features/users/schemas/user.schema";

interface UserDocumentsModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  embedded?: boolean;
}

/** Dedicated action to upload compliance documents and verify pending ones (management). */
export function UserDocumentsModal({ open, onClose, user, embedded }: UserDocumentsModalProps) {
  const roleLabel = user ? ROLE_LABELS[user.role] : "User";
  const name = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email : "";

  return (
    <PanelOrModal
      embedded={embedded}
      open={open}
      onClose={onClose}
      title="Compliance documents"
      description={name ? `${roleLabel} · ${name}` : "Upload and verify certificates."}
      maxWidthClassName="max-w-3xl"
      embeddedMaxWidthClassName="w-full"
    >
      {user && <UserDocumentsSection userId={user.id} />}
    </PanelOrModal>
  );
}
