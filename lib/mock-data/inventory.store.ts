// In-memory mock backend for the Deliveries "Current Inventory" panel.
// Mutated directly by lib/mock-data/deliveries.store.ts when a delivery is processed.
// Resets on dev server restart — acceptable since there is no real backend behind this feature yet.

export interface InventoryItemRecord {
  id:       string;
  name:     string;
  level:    "good" | "medium" | "low";
  stock:    number;
  capacity: number;
  unit:     string;
  site:     string;
}

function levelFor(stock: number, capacity: number): InventoryItemRecord["level"] {
  const ratio = stock / capacity;
  if (ratio <= 0.3) return "low";
  if (ratio <= 0.6) return "medium";
  return "good";
}

let inventory: InventoryItemRecord[] = [
  { id: "inv-1", name: "Disinfectant Spray", level: "medium", stock: 45,  capacity: 100, unit: "bottles", site: "Site A" },
  { id: "inv-2", name: "Floor Cleaner",      level: "good",   stock: 82,  capacity: 100, unit: "bottles", site: "Site A" },
  { id: "inv-3", name: "Hand Sanitizer",     level: "good",   stock: 95,  capacity: 120, unit: "bottles", site: "Site A" },
  { id: "inv-4", name: "Microfiber Cloths",  level: "good",   stock: 150, capacity: 200, unit: "pieces",  site: "Site A" },
  { id: "inv-5", name: "Mop Heads",          level: "medium", stock: 18,  capacity: 50,  unit: "pieces",  site: "Site A" },
];

export function getInventory(): InventoryItemRecord[] {
  return inventory;
}

/** Adds delivered quantity to the matching inventory item's stock (by name), capped at capacity. */
export function incrementStockByName(name: string, amount: number): void {
  inventory = inventory.map((item) => {
    if (item.name !== name) return item;
    const stock = Math.min(item.capacity, item.stock + amount);
    return { ...item, stock, level: levelFor(stock, item.capacity) };
  });
}
