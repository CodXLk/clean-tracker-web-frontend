"use client";

import { Building2, CalendarRange, Users, UserCog } from "lucide-react";
import { PanelOrModal } from "@/components/shared/PanelOrModal";
import {
  OUTSOURCE_SCOPE_LABELS,
  type OutsourceProject,
} from "@/features/outsource/schemas/outsourceProject.schema";

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
}

interface OutsourceProjectDetailModalProps {
  open: boolean;
  onClose: () => void;
  project: OutsourceProject | null;
  embedded?: boolean;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-grey-500">{label}</span>
      <span className="text-sm text-on-surface">{value}</span>
    </div>
  );
}

export function OutsourceProjectDetailModal({
  open,
  onClose,
  project,
  embedded,
}: OutsourceProjectDetailModalProps) {
  if (!project) return null;

  const assignedCleaners = project.cleanerProfiles.filter((s) => s.cleanerId);
  const assignedSupervisors = project.supervisorProfiles.filter((s) => s.supervisorId);

  return (
    <PanelOrModal
      embedded={embedded}
      open={open}
      onClose={onClose}
      title={project.companyName}
      description="Outsource project details"
      maxWidthClassName="max-w-2xl"
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-2xl border border-grey-200 bg-surface p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Contact person" value={project.contactPersonName || "—"} />
            <Field label="Contact number" value={project.contactNumber || "—"} />
            <Field
              label="Site"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <Building2 size={14} aria-hidden="true" className="text-grey-500" />
                  {project.siteName ?? "—"}
                </span>
              }
            />
            <Field label="Scope" value={OUTSOURCE_SCOPE_LABELS[project.scopeType]} />
            <Field
              label="Period"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <CalendarRange size={14} aria-hidden="true" className="text-grey-500" />
                  {formatDate(project.startDate)} → {formatDate(project.endDate)}
                </span>
              }
            />
            <Field
              label="Covered tasks"
              value={`${project.taskCount} task${project.taskCount === 1 ? "" : "s"}`}
            />
          </div>
        </div>

        <div className={`grid grid-cols-1 gap-4 ${embedded ? "lg:grid-cols-2" : ""}`}>
          <section className="flex flex-col gap-2 rounded-2xl border border-grey-200 bg-surface p-4 sm:p-5">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-on-surface">
              <Users size={15} aria-hidden="true" className="text-[#ED5F25]" />
              Outsource cleaners ({assignedCleaners.length}/{project.numberOfOutsourceCleaners})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {assignedCleaners.length === 0 ? (
                <span className="text-sm text-grey-500">No cleaners assigned yet.</span>
              ) : (
                assignedCleaners.map((s) => (
                  <span
                    key={s.id}
                    className="rounded-full bg-grey-100 px-2.5 py-1 text-xs font-medium text-on-surface"
                  >
                    {s.cleanerName ?? "Assigned"}
                  </span>
                ))
              )}
            </div>
          </section>

          <section className="flex flex-col gap-2 rounded-2xl border border-grey-200 bg-surface p-4 sm:p-5">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-on-surface">
              <UserCog size={15} aria-hidden="true" className="text-[#ED5F25]" />
              Outsource supervisors ({assignedSupervisors.length}/{project.numberOfOutsourceSupervisors})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {assignedSupervisors.length === 0 ? (
                <span className="text-sm text-grey-500">No supervisors assigned yet.</span>
              ) : (
                assignedSupervisors.map((s) => (
                  <span
                    key={s.id}
                    className="rounded-full bg-grey-100 px-2.5 py-1 text-xs font-medium text-on-surface"
                  >
                    {s.supervisorName ?? "Assigned"}
                  </span>
                ))
              )}
            </div>
          </section>
        </div>

        {!embedded && (
          <div className="mt-1 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-grey-300 px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </PanelOrModal>
  );
}
