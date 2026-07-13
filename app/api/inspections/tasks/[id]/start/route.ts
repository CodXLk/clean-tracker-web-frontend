import { NextResponse } from "next/server";
import { startMyTask } from "@/lib/mock-data/inspections.store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const task = startMyTask(id);

  if (!task) {
    return NextResponse.json({ message: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(task);
}
