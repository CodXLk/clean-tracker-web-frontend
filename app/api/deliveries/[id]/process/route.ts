import { NextResponse } from "next/server";
import { processDelivery, type ProcessDeliveryInput } from "@/lib/mock-data/deliveries.store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as ProcessDeliveryInput;
  const delivery = processDelivery(id, body);

  if (!delivery) {
    return NextResponse.json({ message: "Delivery not found" }, { status: 404 });
  }

  return NextResponse.json(delivery);
}
