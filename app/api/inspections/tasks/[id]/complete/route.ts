import { NextResponse } from "next/server";
import { completeMyTask } from "@/lib/mock-data/inspections.store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  completeMyTask(id);
  return NextResponse.json({ message: "Task completed" });
}
