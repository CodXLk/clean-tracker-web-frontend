"use client";

import { useMemo, useState } from "react";
import { UserCog } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { PillButton } from "@/components/shared/PillButton";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { SearchableSelect, type SelectOption } from "./SearchableSelect";
import {
  useSiteCleanerProfiles,
  useAssignCleanerProfiles,
  type ProfileAssignmentInput,
} from "@/features/user-management/hooks/useSiteAssignments";
import { useCleaners } from "@/features/cleaners/hooks/useCleaners";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import type { Site } from "@/features/user-management/schemas/site.schema";

const UNASSIGNED = "";

function personName(first?: string | null, last?: string | null): string {
  return [first, last].filter(Boolean).join(" ").trim() || "Unnamed";
}

interface CleanerProfilesModalProps {
  open: boolean;
  onClose: () => void;
  site: Site | null;
}

export function CleanerProfilesModal({ open, onClose, site }: CleanerProfilesModalProps) {
  const profilesQuery = useSiteCleanerProfiles(open ? site?.id : undefined);
  const cleanersQuery = useCleaners();
  const assign = useAssignCleanerProfiles();

  // profileId -> selected cleanerId ("" = unassigned)
  const [selections, setSelections] = useState<Record<string, string>>({});

  const profiles = useMemo(
    () => [...(profilesQuery.data ?? [])].sort((a, b) => a.profileIndex - b.profileIndex),
    [profilesQuery.data],
  );

  // Sync local selections when the profiles load / modal opens.
  const loadedKey = useMemo(
    () => profiles.map((p) => `${p.id}:${p.cleanerId ?? ""}`).join("|"),
    [profiles],
  );
  const [syncedKey, setSyncedKey] = useState<string | null>(null);
  if (open && !profilesQuery.isLoading && loadedKey !== syncedKey) {
    setSyncedKey(loadedKey);
    setSelections(Object.fromEntries(profiles.map((p) => [p.id, p.cleanerId ?? UNASSIGNED])));
  }
  if (!open && syncedKey !== null) {
    setSyncedKey(null);
    setSelections({});
    assign.reset();
  }

  const cleanerOptions: SelectOption[] = useMemo(
    () => [
      { value: UNASSIGNED, label: "— Unassigned —" },
      ...(cleanersQuery.data ?? []).map((c) => ({
        value: c.id,
        label: personName(c.firstName, c.lastName),
        sublabel: c.email ?? undefined,
      })),
    ],
    [cleanersQuery.data],
  );

  // A cleaner may only occupy one slot at a time.
  const takenBy = useMemo(() => {
    const map = new Map<string, string>(); // cleanerId -> profileId
    for (const [profileId, cleanerId] of Object.entries(selections)) {
      if (cleanerId) map.set(cleanerId, profileId);
    }
    return map;
  }, [selections]);

  const duplicateCleaner = useMemo(() => {
    const counts = new Map<string, number>();
    for (const cleanerId of Object.values(selections)) {
      if (cleanerId) counts.set(cleanerId, (counts.get(cleanerId) ?? 0) + 1);
    }
    return [...counts.values()].some((n) => n > 1);
  }, [selections]);

  function handleSave() {
    if (!site || duplicateCleaner) return;
    const payload: ProfileAssignmentInput[] = profiles.map((p) => ({
      profileId: p.id,
      cleanerId: selections[p.id] ? selections[p.id] : null,
    }));
    assign.mutate({ siteId: site.id, profiles: payload }, { onSuccess: onClose });
  }

  const isLoading = profilesQuery.isLoading || cleanersQuery.isLoading;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign cleaners to slots"
      description={site ? `Cleaner slots for “${site.name}”` : undefined}
    >
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : profiles.length === 0 ? (
        <p className="py-8 text-center text-sm text-grey-500">
          This site has no cleaner slots yet. Edit the site and set the number of cleaners first.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="rounded-xl bg-grey-50 px-3 py-2 text-xs text-grey-500">
            Each slot holds one cleaner. Switching a cleaner here reassigns all of that slot’s future
            tasks to the new cleaner — past completions are preserved.
          </p>

          <div className="flex flex-col gap-3">
            {profiles.map((p) => {
              const current = selections[p.id] ?? UNASSIGNED;
              const conflictProfileId = current ? takenBy.get(current) : undefined;
              const hasConflict = !!current && conflictProfileId !== p.id && conflictProfileId !== undefined;
              return (
                <div key={p.id} className="flex flex-col gap-1">
                  <SearchableSelect
                    label={p.label || `Cleaner ${p.profileIndex}`}
                    options={cleanerOptions}
                    value={current}
                    onChange={(value) =>
                      setSelections((prev) => ({ ...prev, [p.id]: value }))
                    }
                    placeholder="Select a cleaner"
                    searchPlaceholder="Search cleaners…"
                    emptyMessage="No cleaners available"
                    error={hasConflict ? "This cleaner is already assigned to another slot." : undefined}
                  />
                </div>
              );
            })}
          </div>

          {assign.isError && <p className="text-sm text-error">{getErrorMessage(assign.error)}</p>}

          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={assign.isPending}
              className="rounded-full border border-grey-300 px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100 disabled:opacity-60"
            >
              Cancel
            </button>
            <PillButton
              type="button"
              variant="teal"
              onClick={handleSave}
              disabled={assign.isPending || duplicateCleaner}
              className="w-auto px-6"
            >
              <span className="inline-flex items-center gap-2">
                <UserCog size={16} aria-hidden="true" />
                {assign.isPending ? "Saving…" : "Save slots"}
              </span>
            </PillButton>
          </div>
        </div>
      )}
    </Modal>
  );
}
