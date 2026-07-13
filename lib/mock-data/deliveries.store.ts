// In-memory mock backend for the Deliveries admin page.
// Resets on dev server restart — acceptable since there is no real backend behind this feature yet.

import { getInventory, incrementStockByName } from "@/lib/mock-data/inventory.store";

export type DeliveryStatus = "pending" | "in_transit" | "delivered";
export type DeliveryPriority = "high" | "medium" | "low";

export interface DeliveryLineItem {
  name:          string;
  requestedQty:  number;
  deliveredQty?: number;
  unit:          string;
}

export interface DeliveryRecord {
  id:          string;
  label:       string;
  site:        string;
  requestedBy: string;
  requestedAt: string;
  status:      DeliveryStatus;
  priority:    DeliveryPriority;
  items:       DeliveryLineItem[];
  notes?:      string;
}

let deliveries: DeliveryRecord[] = [
  {
    id: "delivery-1",
    label: "Delivery #1",
    site: "Site A",
    requestedBy: "Jane Doe",
    requestedAt: "2026-04-11 · 09:30 AM",
    status: "pending",
    priority: "high",
    items: [
      { name: "Disinfectant Spray", requestedQty: 10, unit: "bottles" },
      { name: "Microfiber Cloths",  requestedQty: 50, unit: "pieces" },
    ],
  },
  {
    id: "delivery-2",
    label: "Delivery #2",
    site: "Site A",
    requestedBy: "John Smith",
    requestedAt: "2026-04-09 · 01:00 PM",
    status: "delivered",
    priority: "medium",
    items: [
      { name: "Floor Cleaner", requestedQty: 20, deliveredQty: 20, unit: "bottles" },
      { name: "Mop Heads",     requestedQty: 15, deliveredQty: 15, unit: "pieces" },
    ],
  },
  {
    id: "delivery-3",
    label: "Delivery #3",
    site: "Site A",
    requestedBy: "Maria Garcia",
    requestedAt: "2026-04-08 · 03:15 PM",
    status: "delivered",
    priority: "low",
    items: [
      { name: "Hand Sanitizer", requestedQty: 25, deliveredQty: 25, unit: "bottles" },
      { name: "Paper Towels",   requestedQty: 40, deliveredQty: 40, unit: "rolls" },
      { name: "Trash Bags",     requestedQty: 60, deliveredQty: 60, unit: "pieces" },
    ],
  },
  {
    id: "delivery-4",
    label: "Delivery #4",
    site: "Site A",
    requestedBy: "Chen Wei",
    requestedAt: "2026-04-11 · 08:00 AM",
    status: "in_transit",
    priority: "high",
    items: [
      { name: "Glass Cleaner", requestedQty: 12, unit: "bottles" },
      { name: "Sponges",       requestedQty: 30, unit: "pieces" },
    ],
  },
];

export function getDeliveries(): DeliveryRecord[] {
  return deliveries;
}

export function getDeliveryById(id: string): DeliveryRecord | undefined {
  return deliveries.find((d) => d.id === id);
}

export interface ProcessDeliveryInput {
  items: Array<{ name: string; deliveredQty: number }>;
  notes?: string;
}

export function processDelivery(id: string, input: ProcessDeliveryInput): DeliveryRecord | undefined {
  let updated: DeliveryRecord | undefined;
  deliveries = deliveries.map((delivery) => {
    if (delivery.id !== id) return delivery;
    const items = delivery.items.map((item) => {
      const match = input.items.find((i) => i.name === item.name);
      return match ? { ...item, deliveredQty: match.deliveredQty } : item;
    });
    updated = { ...delivery, status: "delivered", items, notes: input.notes };
    return updated;
  });

  if (updated) {
    for (const item of input.items) {
      incrementStockByName(item.name, item.deliveredQty);
    }
  }

  return updated;
}

export function getDeliveryKpis() {
  const pending   = deliveries.filter((d) => d.status === "pending").length;
  const inTransit = deliveries.filter((d) => d.status === "in_transit").length;
  const delivered = deliveries.filter((d) => d.status === "delivered").length;
  const lowStockItems = getInventory().filter((item) => item.level === "low").length;
  return {
    pending,
    inTransit,
    delivered,
    lowStockItems,
  };
}
