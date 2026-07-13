import { NextResponse } from "next/server";
import {
  getComplaints,
  getComplaintKpis,
  createComplaint,
  type CreateComplaintInput,
} from "@/lib/mock-data/complaints.store";

export async function GET() {
  return NextResponse.json({
    complaints: getComplaints(),
    kpis:       getComplaintKpis(),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateComplaintInput;
  const complaint = createComplaint(body);
  return NextResponse.json(complaint, { status: 201 });
}
