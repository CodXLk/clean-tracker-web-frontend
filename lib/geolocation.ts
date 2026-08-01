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
