import { NextResponse } from "next/server";
import { getInventory } from "@/lib/mock-data/inventory.store";

export async function GET() {
  return NextResponse.json({ inventory: getInventory() });
}
