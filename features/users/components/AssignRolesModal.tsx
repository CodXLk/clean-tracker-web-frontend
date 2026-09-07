"use client";

import { useEffect, useState } from "react";
import { PanelOrModal } from "@/components/shared/PanelOrModal";
import { PillButton } from "@/components/shared/PillButton";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useUpdateUserRoles } from "@/features/users/hooks/useUserActions";
import { useRoles } from "@/features/users/hooks/useRoles";
import type { Role, User } from "@/features/users/schemas/user.schema";

interface AssignRolesModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  embedded?: boolean;
}

/** Dedicated action to assign the roles a person can operate as. */
export function AssignRolesModal({ open, onClose, user, embedded }: AssignRolesModalProps) {
  const rolesQuery = useRoles();
  const updateRoles = useUpdateUserRoles();
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);

  useEffect(() => {
    if (!open || !user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedRoles((user.roles?.length ? user.roles : [user.role]) as Role[]);
    updateRoles.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  function toggleRole(role: Role, checked: boolean) {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (checked) next.add(role);
      else next.delete(role);
      return Array.from(next);
    });
  }

  function save() {
    if (!user || selectedRoles.length === 0) return;
    updateRoles.mutate({ id: user.id, roles: selectedRoles }, { onSuccess: onClose });
  }

  const optionNames = (rolesQuery.data ?? []).map((r) => r.name);
  const extraCurrentRoles = selectedRoles.filter((r) => !optionNames.includes(r));

  return (
    <PanelOrModal
      embedded={embedded}
      open={open}
      onClose={onClose}
      title="Assign roles"
      description="Choose every role this person can operate as. They'll pick one to work as at sign-in."
      embeddedMaxWidthClassName="w-full"
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(rolesQuery.data ?? []).map((role) => {
            const checked = selectedRoles.includes(role.name);
            return (
              <label
                key={role.name}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-grey-300 px-3.5 py-2.5 text-sm text-on-surface transition-colors hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-grey-300 text-primary focus:ring-primary/30"
                  checked={checked}
                  onChange={(e) => toggleRole(role.name, e.target.checked)}
                />
                {role.label}
              </label>
            );
          })}
        </div>

        {rolesQuery.isLoading && <p className="text-xs text-body-2">Loading roles…</p>}
        {extraCurrentRoles.length > 0 && (
          <p className="text-xs text-body-2">Also currently assigned: {extraCurrentRoles.join(", ")}</p>
        )}
        {selectedRoles.length === 0 && (
          <p className="text-xs font-medium text-error">A user must keep at least one role.</p>
        )}
        {updateRoles.isError && (
          <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
            {getErrorMessage(updateRoles.error)}
          </p>
        )}

        <div className="flex gap-3 border-t border-line pt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-full border border-grey-300 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100"
          >
            Cancel
          </button>
          <PillButton
            type="button"
            variant="teal"
            className="h-11 flex-1"
            onClick={save}
            disabled={updateRoles.isPending || selectedRoles.length === 0}
          >
            {updateRoles.isPending ? "Saving…" : "Save roles"}
          </PillButton>
        </div>
      </div>
    </PanelOrModal>
  );
}
