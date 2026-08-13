"use client";

import { Modal } from "@/components/shared/Modal";
import { UserDocumentsSection } from "./UserDocumentsSection";

interface UserDocumentsModalProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  personName?: string;
}

export function UserDocumentsModal({ open, onClose, userId, personName }: UserDocumentsModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={personName ? `Documents — ${personName}` : "Compliance documents"}
      description="Upload, verify and manage compliance certificates."
      maxWidthClassName="max-w-2xl"
    >
      {userId ? (
        <UserDocumentsSection userId={userId} />
      ) : (
        <p className="text-sm text-grey-500">No user selected.</p>
      )}
    </Modal>
  );
}
