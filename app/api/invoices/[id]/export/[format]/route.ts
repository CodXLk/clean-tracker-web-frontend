import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/constants";
import { BACKEND } from "@/lib/api/endpoints";

const FORMATS = new Set(["xlsx", "pdf"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Streams an invoice export (Excel or PDF) from the backend. */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/invoices/[id]/export/[format]">) {
  const { id, format } = await ctx.params;
  if (!FORMATS.has(format) || !UUID_RE.test(id)) {
    return NextResponse.json({ message: "Unknown format" }, { status: 404 });
  }
  const headers: Record<string, string> = { "x-api-key": process.env.SPRING_BOOT_API_KEY ?? "" };
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(`${process.env.SPRING_BOOT_API_URL}${BACKEND.invoices.export(id, format)}`, {
    method: "GET",
    headers,
    cache: "no-store",
  });
  if (!response.ok) {
    return NextResponse.json({ message: "Export failed" }, { status: response.status });
  }
  const out: Record<string, string> = {
    "Content-Type": response.headers.get("content-type") ?? "application/octet-stream",
    "Cache-Control": "no-store",
  };
  const disposition = response.headers.get("content-disposition");
  if (disposition) out["Content-Disposition"] = disposition;
  return new NextResponse(await response.arrayBuffer(), { status: 200, headers: out });
}
