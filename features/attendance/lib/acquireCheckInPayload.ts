import { getCurrentPosition } from "@/lib/geolocation";
import { isNfcSupported, readNfcTag } from "@/lib/nfc";
import type { CheckInPayload, CleanerSite } from "@/features/attendance/schemas/attendance.schema";

/**
 * Resolve how the cleaner proves presence for a check-in/out: prefer the site's NFC tag on
 * capable devices, otherwise (or on scan failure) fall back to geolocation.
 */
export async function acquireCheckInPayload(site: CleanerSite): Promise<CheckInPayload> {
  if (site.nfcRegistered && isNfcSupported()) {
    try {
      const uid = await readNfcTag();
      return { siteId: site.siteId, method: "NFC", nfcTagId: uid };
    } catch (err) {
      // No location fallback available — surface the NFC error as-is.
      if (!site.hasCoordinates) throw err;
    }
  }
  if (!site.hasCoordinates) {
    throw new Error("This site has no NFC tag or map location set up. Please contact your supervisor.");
  }
  const pos = await getCurrentPosition();
  return {
    siteId: site.siteId,
    method: "GEO",
    latitude: pos.lat,
    longitude: pos.lng,
    accuracyMeters: pos.accuracy,
  };
}
