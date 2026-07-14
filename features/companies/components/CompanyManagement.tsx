"use client";

import { useState } from "react";
import { Building2, Plus } from "lucide-react";
import { useCompanies } from "@/features/companies/hooks/useCompanies";
import { useMe } from "@/features/auth/hooks/useMe";
import { CreateCompanyModal } from "./CreateCompanyModal";
import { COMPANY_MANAGER_ROLES } from "@/features/users/lib/permissions";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";

export function CompanyManagement() {
  const [modalOpen, setModalOpen] = useState(false);
  const me = useMe();
  const companiesQuery = useCompanies();

  const canManage = me.data ? COMPANY_MANAGER_ROLES.has(me.data.role) : false;

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-on-surface">Client Companies</h1>
            <p className="mt-1 text-sm text-grey-500">Businesses that engage Primeway for cleaning services</p>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
            >
              <Plus size={18} aria-hidden="true" />
              Add company
            </button>
          )}
        </div>

        {companiesQuery.isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : companiesQuery.isError ? (
          <div className="rounded-2xl bg-surface p-6 text-sm font-medium text-error shadow-sm">
            Failed to load companies.
          </div>
        ) : companiesQuery.data && companiesQuery.data.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {companiesQuery.data.map((company) => (
              <div key={company.id} className="rounded-2xl bg-surface p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 size={20} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-on-surface">{company.name}</p>
                    <p className="text-xs text-grey-500">
                      {[company.city, company.state].filter(Boolean).join(", ") || "—"}
                    </p>
                  </div>
                </div>
                <dl className="flex flex-col gap-1 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-grey-500">Contact</dt>
                    <dd className="truncate text-on-surface">{company.contactEmail ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-grey-500">Phone</dt>
                    <dd className="text-on-surface">{company.contactPhone ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-grey-500">Status</dt>
                    <dd>
                      <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                        {company.status}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-surface shadow-sm">
            <EmptyState
              title="No client companies yet"
              description={canManage ? "Add your first client company to start onboarding contacts." : "No companies to display."}
            />
          </div>
        )}
      </div>

      {canManage && <CreateCompanyModal open={modalOpen} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
