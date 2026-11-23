import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/constants";
import { BACKEND } from "@/lib/api/endpoints";

// Forwards the client's review (decision, note and `photos` files) to the Spring backend.
export async function POST(request: NextRequest, ctx: RouteContext<"/api/work-orders/[id]/client-review">) {
  const { id } = await ctx.params;
  try {
    const formData = await request.formData();
    const headers: Record<string, string> = {
      "x-api-key": process.env.SPRING_BOOT_API_KEY ?? "",
    };
    const token = (await cookies()).get(AUTH_COOKIE)?.value;
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${process.env.SPRING_BOOT_API_URL}${BACKEND.workOrders.clientReview(id)}`, {
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
        { message: envelope.message ?? "Failed to send your review" },
        { status: response.status || 500 },
      );
    }
    return NextResponse.json(envelope.data ?? null);
  } catch {
    return NextResponse.json({ message: "Failed to send your review" }, { status: 500 });
  }
}
