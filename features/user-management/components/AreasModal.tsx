"use client";

import { Modal } from "@/components/shared/Modal";
import { PillButton } from "@/components/shared/PillButton";
import { AreasSection } from "./AreasSection";

interface AreasModalProps {
  open: boolean;
  onClose: () => void;
  floorId: string;
  floorName?: string;
}

export function AreasModal({ open, onClose, floorId, floorName }: AreasModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={floorName ? `Areas — ${floorName}` : "Areas"}
      description="Areas only exist under a floor. Add, rename, or remove them below."
    >
      <div className="flex flex-col gap-4">
        <AreasSection floorId={floorId} />
        <PillButton type="button" variant="teal" className="h-11" onClick={onClose}>
          Done
        </PillButton>
      </div>
    </Modal>
  );
}
