/**
 * The server's 409 details when leaving — or restarting a paused session away from the site — needs a
 * forced check-out (backend `ForcedCheckoutRequiredException`, forwarded by the API proxy as `data`).
 */
export interface ForcedCheckoutDetails {
  /** CHECK_OUT: the check-out itself needs forcing. RESUME: a paused session can't restart away from the site. */
  action: "CHECK_OUT" | "RESUME";
  locationMismatch: boolean;
  /** A note is required (mandatory minimum / pending tasks); otherwise it's optional. */
  noteRequired: boolean;
  distanceMeters: number | null;
  radiusMeters: number | null;
  /** Why checking out isn't possible yet (e.g. open complaints) — no forced check-out is offered. */
  checkoutBlocked: string | null;
}

export function forcedCheckoutDetails(error: unknown): ForcedCheckoutDetails | null {
  const response = (error as { response?: { status?: number; data?: { data?: unknown } } } | null)?.response;
  const d = response?.data?.data as Record<string, unknown> | null | undefined;
  if (response?.status !== 409 || !d || d.code !== "FORCED_CHECKOUT_REQUIRED") return null;
  return {
    action: d.action === "RESUME" ? "RESUME" : "CHECK_OUT",
    locationMismatch: d.locationMismatch === true,
    noteRequired: d.noteRequired === true,
    distanceMeters: typeof d.distanceMeters === "number" ? d.distanceMeters : null,
    radiusMeters: typeof d.radiusMeters === "number" ? d.radiusMeters : null,
    checkoutBlocked: typeof d.checkoutBlocked === "string" ? d.checkoutBlocked : null,
  };
}
