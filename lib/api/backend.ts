// ⚠️ Server-only. Never import from a "use client" component.
// Centralises calls from Next.js Route Handlers to the Spring Boot backend:
// injects the internal API key and forwards the auth JWT from the HTTP-only cookie.
// (Imports next/headers `cookies()`, which is server-only and will error if bundled for the client.)
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/constants";

interface BackendCallOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Attach the caller's JWT (from the auth cookie) as a Bearer token. Default true. */
  auth?: boolean;
}

export interface BackendResult {
  ok: boolean;
  status: number;
  json: unknown;
}

/**
 * Perform a request against the Spring Boot backend. Returns the parsed body and status.
 * The backend uses the `{ code, data, message }` envelope.
 */
export async function callBackend(path: string, options: BackendCallOptions = {}): Promise<BackendResult> {
  const { method = "GET", body, auth = true } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": process.env.SPRING_BOOT_API_KEY ?? "",
  };

  if (auth) {
    const token = (await cookies()).get(AUTH_COOKIE)?.value;
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${process.env.SPRING_BOOT_API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
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

  return { ok: response.ok, status: response.status, json };
}

/**
 * Proxy a backend call straight through to a NextResponse, unwrapping the envelope's
 * `data` field on success and surfacing `{ message }` on failure.
 */
export async function proxyBackend(path: string, options: BackendCallOptions = {}): Promise<NextResponse> {
  try {
    const result = await callBackend(path, options);
    const envelope = (result.json ?? {}) as { data?: unknown; message?: string };
    if (!result.ok) {
      return NextResponse.json(
        { message: envelope.message ?? "Request failed" },
        { status: result.status || 500 },
      );
    }
    return NextResponse.json(envelope.data ?? null, { status: result.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message: `Backend unreachable: ${message}` }, { status: 502 });
  }
}
