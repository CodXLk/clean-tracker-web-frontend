import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { callBackend } from "@/lib/api/backend";
import { AUTH_COOKIE } from "@/lib/constants";
import { BACKEND } from "@/lib/api/endpoints";

interface BackendComplaint {
  status: "open" | "in_progress" | "resolved" | "closed";
}

// Lists complaints from the Spring backend (role-scoped there) and derives KPI counts.
export async function GET() {
  const result = await callBackend(BACKEND.complaints.list, { method: "GET" });
  const envelope = (result.json ?? {}) as { data?: unknown; message?: string };
  if (!result.ok) {
    return NextResponse.json(
      { message: envelope.message ?? "Failed to load complaints" },
      { status: result.status || 500 },
    );
  }
  const complaints = Array.isArray(envelope.data)
    ? (envelope.data as BackendComplaint[])
    : [];
  const kpis = {
    open:       complaints.filter((c) => c.status === "open").length,
    inProgress: complaints.filter((c) => c.status === "in_progress").length,
    resolved:   complaints.filter((c) => c.status === "resolved").length,
    total:      complaints.length,
  };
  return NextResponse.json({ complaints, kpis });
}

// Forwards the multipart form (JSON `data` part + `photos` files) to the Spring backend.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const headers: Record<string, string> = {
      "x-api-key": process.env.SPRING_BOOT_API_KEY ?? "",
    };
    const token = (await cookies()).get(AUTH_COOKIE)?.value;
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${process.env.SPRING_BOOT_API_URL}${BACKEND.complaints.create}`, {
      method: "POST",
      headers, // no Content-Type — fetch sets the multipart boundary from the body
      body: formData,
      cache: "no-store",
    });

    let json: unknown = null;
    const text = await response.text();
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = { message: text };
      }
    }
    const envelope = (json ?? {}) as { data?: unknown; message?: string };
    if (!response.ok) {
      return NextResponse.json(
        { message: envelope.message ?? "Request failed" },
        { status: response.status || 500 },
      );
    }
    return NextResponse.json(envelope.data ?? null, { status: response.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message: `Backend unreachable: ${message}` }, { status: 502 });
  }
}
