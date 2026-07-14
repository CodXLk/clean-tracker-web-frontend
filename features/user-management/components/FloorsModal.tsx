"use client";

import { useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { PillButton } from "@/components/shared/PillButton";
import { FloorsSection } from "./FloorsSection";
import { AreasModal } from "./AreasModal";
import type { Floor } from "@/features/user-management/schemas/floor.schema";

interface FloorsModalProps {
  open: boolean;
  onClose: () => void;
  siteId: string;
  siteName?: string;
}

export function FloorsModal({ open, onClose, siteId, siteName }: FloorsModalProps) {
  const [areasFloor, setAreasFloor] = useState<Floor | null>(null);

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={siteName ? `Floors — ${siteName}` : "Floors"}
        description="Floors only exist under a site. Add, rename, or remove them below, then manage each floor's areas."
      >
        <div className="flex flex-col gap-4">
          <FloorsSection siteId={siteId} onManageAreas={setAreasFloor} />
          <PillButton type="button" variant="teal" className="h-11" onClick={onClose}>
            Done
          </PillButton>
        </div>
      </Modal>

      <AreasModal
        open={!!areasFloor}
        onClose={() => setAreasFloor(null)}
        floorId={areasFloor?.id ?? ""}
        floorName={areasFloor?.name}
      />
    </>
  );
}
