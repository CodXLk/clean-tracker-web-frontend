import { NextResponse } from "next/server";
import { resolveComplaint } from "@/lib/mock-data/complaints.store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const complaint = resolveComplaint(id);

  if (!complaint) {
    return NextResponse.json({ message: "Complaint not found" }, { status: 404 });
  }

  return NextResponse.json(complaint);
}
