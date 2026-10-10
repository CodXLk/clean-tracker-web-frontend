// Promise wrapper around the browser Geolocation API for cleaner check-in.

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

export class GeolocationError extends Error {}

export function isGeolocationSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.geolocation;
}

// Great-circle distance in metres between two lat/lng points (Haversine).
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function getCurrentPosition(timeoutMs = 15000): Promise<GeoPosition> {
  return new Promise<GeoPosition>((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new GeolocationError("Geolocation is not supported by this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new GeolocationError("Location permission was denied. Please allow location access to check in."));
        } else if (error.code === error.TIMEOUT) {
          reject(new GeolocationError("Timed out getting your location. Please try again."));
        } else {
          reject(new GeolocationError("Unable to determine your location. Please try again."));
        }
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
    );
  });
}
