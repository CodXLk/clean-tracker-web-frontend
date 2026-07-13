import { NextResponse } from "next/server";
import { getDeliveries, getDeliveryKpis } from "@/lib/mock-data/deliveries.store";

export async function GET() {
  return NextResponse.json({
    deliveries: getDeliveries(),
    kpis:       getDeliveryKpis(),
  });
}
