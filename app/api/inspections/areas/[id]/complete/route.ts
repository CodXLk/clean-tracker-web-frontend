import { NextResponse } from "next/server";
import { completeAreaInspection } from "@/lib/mock-data/inspections.store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  completeAreaInspection(id);
  return NextResponse.json({ message: "Area inspection completed" });
}
