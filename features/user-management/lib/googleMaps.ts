// Google Maps JS API loader + link helpers for the Site location picker.
// The Maps API key is a browser key by design (it must ship to the client). Keep it in
// NEXT_PUBLIC_GOOGLE_MAPS_API_KEY and secure it with HTTP-referrer + API restrictions in
// Google Cloud Console. Never hardcode a fallback key: a rotated/invalid one silently
// breaks the map everywhere the env var isn't set.
export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export const DEFAULT_MAP_CENTER: GoogleLatLngLiteral = { lat: -33.8688, lng: 151.2093 }; // Sydney

let loadPromise: Promise<GoogleMapsNamespace> | null = null;

// This project loads the SDK via a plain <script> tag rather than Google's newer inline
// bootstrap snippet, so the script's DOM `load` event only tells us the initial JS file
// executed — not that Map/Marker/Geocoder/Places have actually been populated onto the
// `google.maps` namespace (those load as separate async chunks after that). The `callback`
// URL param is Google's long-documented, reliable signal that everything is truly ready;
// relying on the `load` event instead is what caused `new maps.Geocoder()` to intermittently
// throw on a fresh page load.
const CALLBACK_NAME = "__primewayGoogleMapsReady";

/** Load the Google Maps JS API exactly once and resolve with the maps namespace. */
export function loadGoogleMaps(): Promise<GoogleMapsNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser"));
  }
  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(
      new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY — set it and restart/rebuild the app."),
    );
  }
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<GoogleMapsNamespace>((resolve, reject) => {
    const existing = document.getElementById("google-maps-sdk") as HTMLScriptElement | null;

    const onReady = () => {
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error("Google Maps failed to initialise"));
    };

    if (existing) {
      // Another mount already kicked off the load — piggyback on the same callback.
      const previous = window[CALLBACK_NAME] as (() => void) | undefined;
      window[CALLBACK_NAME] = () => {
        previous?.();
        onReady();
      };
      existing.addEventListener("error", () => reject(new Error("Google Maps script failed to load")));
      return;
    }

    window[CALLBACK_NAME] = onReady;

    const script = document.createElement("script");
    script.id = "google-maps-sdk";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=${CALLBACK_NAME}`;
    script.async = true;
    script.defer = true;
    script.addEventListener("error", () => {
      loadPromise = null;
      reject(new Error("Google Maps script failed to load"));
    });
    document.head.appendChild(script);
  });

  return loadPromise;
}

/** Build a shareable Google Maps link for a coordinate pair. */
export function buildMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/**
 * Best-effort extraction of a coordinate from a pasted Google Maps URL.
 * Handles the common `@lat,lng`, `?q=lat,lng`, `query=lat,lng` and `!3dlat!4dlng` forms.
 */
export function parseLatLngFromUrl(url: string): GoogleLatLngLiteral | null {
  if (!url) return null;

  const patterns: RegExp[] = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /[?&]query=(-?\d+\.\d+),(-?\d+\.\d+)/,
    /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
    /(-?\d{1,3}\.\d{3,}),\s*(-?\d{1,3}\.\d{3,})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const lat = Number(match[1]);
      const lng = Number(match[2]);
      if (isValidLatLng(lat, lng)) return { lat, lng };
    }
  }
  return null;
}

export function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}
