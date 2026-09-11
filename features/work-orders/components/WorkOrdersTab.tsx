"use client";

import { useMemo, useState } from "react";
import { Plus, Eye, Pencil, Trash2, Users, UserCog, ListPlus, Building2 } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/shared/SearchInput";
import { RowMenu } from "@/features/user-management/components/RowMenu";
import { ConfirmDialog } from "@/features/user-management/components/ConfirmDialog";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { NewAssignmentModal, type WorkOrderTaskConfig } from "@/components/admin/NewAssignmentModal";
import { useWorkOrders, useDeleteWorkOrder, useUpdateWorkOrderStatus } from "@/features/work-orders/hooks/useWorkOrders";
import {
  WORK_ORDER_STATUS_VALUES,
  WORK_ORDER_STATUS_LABELS,
  type WorkOrder,
  type WorkOrderStatus,
} from "@/features/work-orders/schemas/workOrder.schema";
import { WorkOrderFormModal } from "./WorkOrderFormModal";
import { WorkOrderDetailModal } from "./WorkOrderDetailModal";
import { WorkOrderProfilesModal } from "./WorkOrderProfilesModal";

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
}

/** Compact span of the dates a work order has tasks on (derived from its task occurrences). */
function formatDates(dates?: string[] | null): string {
  if (!dates || dates.length === 0) return "—";
  const sorted = [...dates].sort();
  const first = formatDate(sorted[0]);
  if (sorted.length === 1) return first;
  return `${first} → ${formatDate(sorted[sorted.length - 1])} (${sorted.length}d)`;
}

const STATUS_STYLES: Record<WorkOrderStatus, string> = {
  PENDING: "bg-grey-100 text-grey-600",
  APPROVED: "bg-blue-100 text-blue-700",
  ONGOING: "bg-amber-100 text-amber-700",
  TASKS_COMPLETED: "bg-teal-100 text-teal-700",
  PENDING_REVIEW: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-success/10 text-success",
};

/** Work Orders tab — out-of-scope client jobs with their own cleaner/supervisor slots. */
export function WorkOrdersTab({ onAddWorkOrderSite }: { onAddWorkOrderSite?: () => void } = {}) {
  const workOrdersQuery = useWorkOrders();
  const deleteWorkOrder = useDeleteWorkOrder();
  const updateStatus = useUpdateWorkOrderStatus();

  const [search, setSearch] = useState("");
  const [formModal, setFormModal] = useState<{ workOrder: WorkOrder | null } | null>(null);
  const [detail, setDetail] = useState<WorkOrder | null>(null);
  const [manage, setManage] = useState<{ workOrder: WorkOrder; kind: "cleaner" | "supervisor" } | null>(null);
  const [addTasks, setAddTasks] = useState<WorkOrder | null>(null);
  const [pendingDelete, setPendingDelete] = useState<WorkOrder | null>(null);
  const [pendingStatus, setPendingStatus] = useState<{ workOrder: WorkOrder; status: WorkOrderStatus } | null>(null);
  const [banner, setBanner] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const workOrders = useMemo(() => {
    const list = workOrdersQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((w) => w.poId.toLowerCase().includes(q));
  }, [workOrdersQuery.data, search]);

  function confirmDelete() {
    if (!pendingDelete) return;
    deleteWorkOrder.mutate(pendingDelete.id, {
      onSuccess: () => {
        setBanner({ kind: "success", text: `Work order ${pendingDelete.poId} removed.` });
        setPendingDelete(null);
      },
    });
  }

  function confirmStatusChange() {
    if (!pendingStatus) return;
    const { workOrder, status } = pendingStatus;
    updateStatus.mutate(
      { id: workOrder.id, status },
      {
        onSuccess: () => {
          setBanner({
            kind: "success",
            text:
              status === "PENDING_REVIEW"
                ? `Work order ${workOrder.poId} marked for review — the client has been emailed and notified.`
                : status === "TASKS_COMPLETED"
                  ? `Work order ${workOrder.poId} tasks completed — company admins and client service managers have been notified.`
                  : `Work order ${workOrder.poId} set to ${WORK_ORDER_STATUS_LABELS[status]}.`,
          });
          setPendingStatus(null);
        },
      },
    );
  }

  const addTasksConfig: WorkOrderTaskConfig | null = addTasks
    ? {
        workOrderId: addTasks.id,
        poId: addTasks.poId,
        siteId: addTasks.siteId ?? "",
        startDate: addTasks.startDate ?? undefined,
        cleanerProfiles: addTasks.cleanerProfiles.map((p) => ({
          id: p.id,
          label: p.label,
          cleanerName: p.cleanerName,
        })),
        supervisorProfileIds: addTasks.supervisorProfiles.map((p) => p.id),
      }
    : null;

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by PO ID…"
          className="w-full sm:max-w-xs"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {onAddWorkOrderSite && (
            <button
              type="button"
              onClick={onAddWorkOrderSite}
              className="flex items-center gap-2 rounded-full border border-grey-300 px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100"
            >
              <Building2 size={18} aria-hidden="true" />
              Add work order site
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setBanner(null);
              setFormModal({ workOrder: null });
            }}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Plus size={18} aria-hidden="true" />
            New work order
          </button>
        </div>
      </div>

      {banner && (
        <p
          role="status"
          className={`mb-4 rounded-lg px-3 py-2 text-sm font-medium ${
            banner.kind === "success" ? "bg-success/10 text-success" : "bg-error/10 text-error"
          }`}
        >
          {banner.text}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
        {workOrdersQuery.isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : workOrdersQuery.isError ? (
          <div className="p-6 text-sm font-medium text-error">{getErrorMessage(workOrdersQuery.error)}</div>
        ) : workOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-grey-300 text-xs uppercase tracking-wide text-grey-500">
                  <th className="px-5 py-3 font-medium">PO ID</th>
                  <th className="px-5 py-3 font-medium">Site</th>
                  <th className="px-5 py-3 font-medium">Dates</th>
                  <th className="px-5 py-3 font-medium">Cleaners</th>
                  <th className="px-5 py-3 font-medium">Tasks</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.map((w) => (
                  <tr key={w.id} className="border-b border-grey-100 last:border-0">
                    <td className="px-5 py-3.5 font-medium text-on-surface">{w.poId}</td>
                    <td className="px-5 py-3.5 text-grey-700">{w.siteName ?? "—"}</td>
                    <td className="px-5 py-3.5 text-grey-700">{formatDates(w.taskDates)}</td>
                    <td className="px-5 py-3.5 text-grey-700">
                      {w.cleanerProfiles.filter((s) => s.cleanerId).length}/{w.numberOfCleaners}
                    </td>
                    <td className="px-5 py-3.5 text-grey-700">{w.taskCount}</td>
                    <td className="px-5 py-3.5">
                      <select
                        aria-label={`Status for ${w.poId}`}
                        value={w.status}
                        disabled={updateStatus.isPending}
                        onChange={(e) =>
                          setPendingStatus({ workOrder: w, status: e.target.value as WorkOrderStatus })
                        }
                        className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold outline-none ${STATUS_STYLES[w.status]}`}
                      >
                        {WORK_ORDER_STATUS_VALUES.map((s) => (
                          <option key={s} value={s}>
                            {WORK_ORDER_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end">
                        <RowMenu
                          label={`Actions for ${w.poId}`}
                          items={[
                            { label: "View details", icon: Eye, onClick: () => setDetail(w) },
                            {
                              label: "Add tasks",
                              icon: ListPlus,
                              onClick: () => {
                                setBanner(null);
                                setAddTasks(w);
                              },
                            },
                            {
                              label: "Edit work order",
                              icon: Pencil,
                              onClick: () => {
                                setBanner(null);
                                setFormModal({ workOrder: w });
                              },
                            },
                            {
                              label: "Assign cleaners",
                              icon: Users,
                              onClick: () => setManage({ workOrder: w, kind: "cleaner" }),
                            },
                            {
                              label: "Assign supervisors",
                              icon: UserCog,
                              onClick: () => setManage({ workOrder: w, kind: "supervisor" }),
                            },
                            {
                              label: "Remove",
                              icon: Trash2,
                              destructive: true,
                              onClick: () => setPendingDelete(w),
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No work orders yet"
            description="Create one when a client requests out-of-scope work at a site."
          />
        )}
      </div>

      <WorkOrderFormModal
        open={!!formModal}
        onClose={() => setFormModal(null)}
        workOrder={formModal?.workOrder ?? null}
        onCreated={(poId) => setBanner({ kind: "success", text: `Work order ${poId} created. Assign cleaners and add tasks.` })}
        onUpdated={(poId) => setBanner({ kind: "success", text: `Work order ${poId} updated.` })}
      />

      <WorkOrderDetailModal open={!!detail} onClose={() => setDetail(null)} workOrder={detail} />

      <WorkOrderProfilesModal
        open={!!manage}
        onClose={() => setManage(null)}
        workOrder={manage?.workOrder ?? null}
        kind={manage?.kind ?? "cleaner"}
      />

      {addTasksConfig && (
        <NewAssignmentModal
          open={!!addTasks}
          onClose={() => setAddTasks(null)}
          workOrderMode={addTasksConfig}
          onCreated={() => {
            setAddTasks(null);
            setBanner({ kind: "success", text: `Tasks added to work order ${addTasks?.poId}.` });
          }}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Remove work order"
        description={
          pendingDelete
            ? `Remove work order "${pendingDelete.poId}"? Its scheduled tasks will be removed too.`
            : ""
        }
        confirmLabel="Remove"
        isPending={deleteWorkOrder.isPending}
        error={deleteWorkOrder.isError ? getErrorMessage(deleteWorkOrder.error) : undefined}
        onConfirm={confirmDelete}
        onClose={() => {
          if (deleteWorkOrder.isPending) return;
          setPendingDelete(null);
        }}
      />

      <ConfirmDialog
        open={!!pendingStatus}
        title="Change work order status"
        description={
          pendingStatus
            ? pendingStatus.status === "PENDING_REVIEW"
              ? `Mark work order "${pendingStatus.workOrder.poId}" as Pending Review? The client will be emailed and notified to review and give feedback.`
              : pendingStatus.status === "TASKS_COMPLETED"
                ? `Mark work order "${pendingStatus.workOrder.poId}" as Tasks Completed? Company admins and client service managers will be emailed and notified to send it to the client for review.`
                : `Change work order "${pendingStatus.workOrder.poId}" status to ${WORK_ORDER_STATUS_LABELS[pendingStatus.status]}?`
            : ""
        }
        confirmLabel="Yes, continue"
        isPending={updateStatus.isPending}
        error={updateStatus.isError ? getErrorMessage(updateStatus.error) : undefined}
        onConfirm={confirmStatusChange}
        onClose={() => {
          if (updateStatus.isPending) return;
          setPendingStatus(null);
        }}
      />
    </>
  );
}
