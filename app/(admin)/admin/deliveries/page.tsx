"use client";

import { useMemo, useState } from "react";
import { Package, Truck, CheckCircle2, AlertTriangle } from "lucide-react";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { SearchInput } from "@/components/shared/SearchInput";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { EmptyState } from "@/components/shared/EmptyState";
import { useDeliveries } from "@/features/deliveries/hooks/useDeliveries";
import { useInventory } from "@/features/deliveries/hooks/useInventory";
import { useProcessDelivery } from "@/features/deliveries/hooks/useProcessDelivery";
import { DeliveryListItem } from "@/features/deliveries/components/DeliveryListItem";
import { InventoryItemRow } from "@/features/deliveries/components/InventoryItemRow";
import { DeliveryDetailModal } from "@/features/deliveries/components/DeliveryDetailModal";
import { ProcessDeliveryModal } from "@/features/deliveries/components/ProcessDeliveryModal";
import type { Delivery } from "@/features/deliveries/types";

type FilterOption = "All" | "Pending" | "In Transit" | "Delivered";

const FILTER_STATUS_MAP: Record<Exclude<FilterOption, "All">, Delivery["status"]> = {
  Pending:      "pending",
  "In Transit": "in_transit",
  Delivered:    "delivered",
};

export default function DeliveriesPage() {
  const { data, isLoading, isError } = useDeliveries();
  const { data: inventoryData } = useInventory();
  const processDeliveryMutation = useProcessDelivery();

  const [filter, setFilter]           = useState<FilterOption>("All");
  const [search, setSearch]           = useState("");
  const [viewDelivery, setViewDelivery]       = useState<Delivery | null>(null);
  const [processDelivery, setProcessDelivery] = useState<Delivery | null>(null);

  const filtered = useMemo(() => {
    const deliveries = data?.deliveries ?? [];
    return deliveries.filter((d) => {
      const matchesFilter = filter === "All" || d.status === FILTER_STATUS_MAP[filter];
      const matchesSearch =
        search.trim() === "" ||
        d.label.toLowerCase().includes(search.toLowerCase()) ||
        d.requestedBy.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [data, filter, search]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <ErrorMessage message="Failed to load deliveries." />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-on-surface">Deliveries &amp; Inventory</h1>
          <p className="mt-1 text-sm text-grey-500">Manage supply deliveries and track inventory</p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard
            icon={Package}
            iconBg="bg-[#ED5F25]/10"
            iconColor="text-[#ED5F25]"
            value={data.kpis.pending}
            label="Pending Deliveries"
            badge="Active"
            badgeColor="text-[#ED5F25]"
          />
          <AdminStatCard
            icon={Truck}
            iconBg="bg-primary/10"
            iconColor="text-primary"
            value={data.kpis.inTransit}
            label="In Transit"
            badge="Moving"
            badgeColor="text-primary"
          />
          <AdminStatCard
            icon={CheckCircle2}
            iconBg="bg-success/10"
            iconColor="text-success"
            value={data.kpis.delivered}
            label="Delivered"
            badge="+2"
            badgeColor="text-success"
          />
          <AdminStatCard
            icon={AlertTriangle}
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
            value={data.kpis.lowStockItems}
            label="Low Stock Items"
            badge={data.kpis.lowStockItems > 0 ? "Alert" : undefined}
            badgeColor="text-purple-600"
          />
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FilterTabs<FilterOption>
            options={["All", "Pending", "In Transit", "Delivered"]}
            value={filter}
            onChange={setFilter}
          />
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search deliveries..."
            className="sm:w-72"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            {filtered.length === 0 ? (
              <EmptyState title="No deliveries found" description="Try a different filter or search." />
            ) : (
              filtered.map((delivery) => (
                <DeliveryListItem
                  key={delivery.id}
                  delivery={delivery}
                  onViewDetails={() => setViewDelivery(delivery)}
                  onProcess={() => setProcessDelivery(delivery)}
                />
              ))
            )}
          </div>

          <div className="rounded-2xl bg-surface p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-on-surface">Current Inventory</h2>
            <div className="flex flex-col gap-3">
              {(inventoryData?.inventory ?? []).map((item) => (
                <InventoryItemRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <DeliveryDetailModal
        open={viewDelivery !== null}
        onClose={() => setViewDelivery(null)}
        delivery={viewDelivery}
        onProcess={(delivery) => {
          setViewDelivery(null);
          setProcessDelivery(delivery);
        }}
      />

      <ProcessDeliveryModal
        open={processDelivery !== null}
        onClose={() => setProcessDelivery(null)}
        delivery={processDelivery}
        onSubmit={(id, formData) => processDeliveryMutation.mutate({ id, data: formData })}
      />
    </div>
  );
}
