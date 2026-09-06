"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  Brush,
  Building2,
  ChevronRight,
  Headset,
  Loader2,
  ShieldCheck,
  UserCog,
  Briefcase,
  Handshake,
  type LucideIcon,
} from "lucide-react";
import { useMe } from "@/features/auth/hooks/useMe";
import { useSelectRole, getAuthErrorMessage } from "@/features/auth/hooks/useAuth";
import { ROLE_LABELS, type Role } from "@/features/users/schemas/user.schema";
import { landingPath } from "@/lib/auth/roles";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const ROLE_META: Record<Role, { description: string; Icon: LucideIcon }> = {
  SUPER_ADMIN: { description: "Full platform administration", Icon: ShieldCheck },
  COMPANY_ADMIN: { description: "Manage your company and staff", Icon: Building2 },
  CLIENT_SERVICE_MANAGER: { description: "Coordinate clients and service delivery", Icon: Headset },
  CLIENT: { description: "View your sites and requests", Icon: Briefcase },
  SUPERVISOR: { description: "Oversee cleaners and inspect work", Icon: UserCog },
  CLEANER: { description: "Complete your assigned tasks", Icon: Brush },
  OUTSOURCE_SUPERVISOR: { description: "Oversee outsourced cleaning work", Icon: Handshake },
  OUTSOURCE_CLEANER: { description: "Complete outsourced cleaning tasks", Icon: Handshake },
};

export function RoleSelection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const me = useMe();
  const selectRole = useSelectRole();
  const [pendingRole, setPendingRole] = useState<Role | null>(null);

  const roles = (me.data?.roles ?? []) as Role[];

  function choose(role: Role) {
    if (selectRole.isPending) return; // Prevent duplicate submissions while activating.
    setPendingRole(role);
    selectRole.mutate(role, {
      onSuccess: (data) => {
        const callback = searchParams.get("callbackUrl");
        router.replace(callback || landingPath(data.user.role));
      },
      onError: () => setPendingRole(null),
    });
  }

  if (me.isLoading) {
    return (
      <div className="flex min-h-[160px] items-center justify-center" role="status" aria-live="polite">
        <LoadingSpinner size={28} />
      </div>
    );
  }

  if (me.isError || roles.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
          We couldn&apos;t load your roles. Please sign in again.
        </p>
        <button
          type="button"
          onClick={() => router.replace("/login")}
          className="h-11 rounded-full border border-grey-300 px-6 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  // Activating: show a focused loading state so the user knows what's happening.
  if (selectRole.isPending && pendingRole) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 text-center" role="status" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-base font-medium text-on-surface">
          Signing in as {ROLE_LABELS[pendingRole]}…
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {selectRole.isError && (
        <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
          {getAuthErrorMessage(selectRole.error)}
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {roles.map((role) => {
          const meta = ROLE_META[role];
          const Icon = meta?.Icon ?? ShieldCheck;
          return (
            <li key={role}>
              <button
                type="button"
                onClick={() => choose(role)}
                disabled={selectRole.isPending}
                className="group flex w-full items-center gap-4 rounded-2xl border border-line bg-white p-4 text-left transition-colors hover:border-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-on-surface">{ROLE_LABELS[role]}</span>
                  {meta?.description && (
                    <span className="block text-xs text-body-2">{meta.description}</span>
                  )}
                </span>
                <ChevronRight
                  size={18}
                  className="text-grey-400 transition-colors group-hover:text-primary"
                  aria-hidden="true"
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
