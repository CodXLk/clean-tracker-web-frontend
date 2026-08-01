"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Crosshair, MapPin, Search } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  DEFAULT_MAP_CENTER,
  buildMapsLink,
  loadGoogleMaps,
  parseLatLngFromUrl,
} from "@/features/user-management/lib/googleMaps";

interface LocationPickerProps {
  /** Current Google Maps link (owned by the parent form). */
  value: string;
  /** Called with a fresh Google Maps link when the user picks a location. */
  onChange: (link: string) => void;
  /** Called with the raw coordinates whenever a location is selected. */
  onCoordsChange?: (coords: { lat: number; lng: number }) => void;
}

export function LocationPicker({ value, onChange, onCoordsChange }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapObj = useRef<GoogleMap | null>(null);
  const markerObj = useRef<GoogleMarker | null>(null);
  const geocoderObj = useRef<GoogleGeocoder | null>(null);
  const autocompleteObj = useRef<GoogleAutocomplete | null>(null);
  const mapsNs = useRef<GoogleMapsNamespace | null>(null);
  const lastEmitted = useRef<string>("");

  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searching, setSearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Move the marker/map to a coordinate. When `emit` is true, publish a link upward.
  const applyLocation = useCallback(
    (lat: number, lng: number, emit: boolean) => {
      const maps = mapsNs.current;
      const map = mapObj.current;
      if (!maps || !map) return;
      const position = { lat, lng };

      if (!markerObj.current) {
        markerObj.current = new maps.Marker({ position, map, draggable: true });
        markerObj.current.addListener("dragend", (event: GoogleMapMouseEvent) => {
          if (event.latLng) applyLocation(event.latLng.lat(), event.latLng.lng(), true);
        });
      } else {
        markerObj.current.setPosition(position);
      }

      map.panTo(position);
      map.setZoom(15);

      onCoordsChange?.({ lat, lng });

      if (emit) {
        const link = buildMapsLink(lat, lng);
        lastEmitted.current = link;
        onChange(link);
      }
    },
    [onChange, onCoordsChange],
  );

  // Initialise the map once.
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !mapRef.current) return;
        mapsNs.current = maps;
        geocoderObj.current = new maps.Geocoder();

        const initial = parseLatLngFromUrl(value);
        const center = initial ?? DEFAULT_MAP_CENTER;

        const map = new maps.Map(mapRef.current, {
          center,
          zoom: initial ? 15 : 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
        mapObj.current = map;

        map.addListener("click", (event: GoogleMapMouseEvent) => {
          if (event.latLng) applyLocation(event.latLng.lat(), event.latLng.lng(), true);
        });

        // Google Places Autocomplete on the search field.
        if (searchInputRef.current) {
          const autocomplete = new maps.places.Autocomplete(searchInputRef.current, {
            fields: ["geometry", "formatted_address", "name"],
          });
          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            const location = place.geometry?.location;
            if (location) {
              const label = place.formatted_address ?? place.name ?? "";
              applyLocation(location.lat(), location.lng(), true);
              setStatusMessage(label || "Location selected.");
              if (label) setSearchText(label);
            } else {
              setStatusMessage("No location details available for that suggestion. Try the Search button.");
            }
          });
          autocompleteObj.current = autocomplete;
        }

        if (initial) applyLocation(initial.lat, initial.lng, false);

        // The map is constructed the instant the SDK resolves, which can race ahead of
        // the browser actually painting the freshly-mounted modal — Google Maps then
        // captures a stale/zero container size and renders broken/grey tiles. Wait two
        // frames (guarantees a real paint happened), then force a resize + re-center
        // before revealing the map, so it's never shown in a mis-sized state.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (cancelled) return;
            maps.event.trigger(map, "resize");
            map.setCenter(center);
            setReady(true);
          });
        });
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
      if (autocompleteObj.current && mapsNs.current) {
        mapsNs.current.event.clearInstanceListeners(autocompleteObj.current);
      }
      // Remove any Autocomplete dropdown left attached to <body>.
      document.querySelectorAll(".pac-container").forEach((el) => el.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to the link being edited/pasted directly in the parent field.
  useEffect(() => {
    if (!ready) return;
    if (value === lastEmitted.current) return;
    const parsed = parseLatLngFromUrl(value);
    if (parsed) {
      setStatusMessage(null);
      applyLocation(parsed.lat, parsed.lng, false);
    }
  }, [value, ready, applyLocation]);

  function handleSearch() {
    const geocoder = geocoderObj.current;
    const query = searchText.trim();
    if (!geocoder || !query) return;
    setSearching(true);
    setStatusMessage(null);
    geocoder.geocode({ address: query }, (results, status) => {
      setSearching(false);
      if (status === "OK" && results && results[0]) {
        const loc = results[0].geometry.location;
        applyLocation(loc.lat(), loc.lng(), true);
        setStatusMessage(results[0].formatted_address);
      } else {
        setStatusMessage("No results found for that search.");
      }
    });
  }

  function handleLiveLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatusMessage("Geolocation is not supported by this browser.");
      return;
    }
    setStatusMessage("Locating…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        applyLocation(position.coords.latitude, position.coords.longitude, true);
        setStatusMessage("Using your current location.");
      },
      () => setStatusMessage("Unable to retrieve your location. Please allow location access."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-on-surface">Select Location on Map</p>

      <div className="flex flex-col gap-2">
        {/* Full-width row so the Places Autocomplete suggestion panel is wide and easy to read. */}
        <div className="flex w-full items-center gap-2 rounded-xl border border-grey-300 bg-white px-3">
          <Search size={16} className="shrink-0 text-grey-500" aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Start typing an address or place name…"
            aria-label="Search location"
            autoComplete="off"
            className="h-11 w-full text-sm text-on-surface outline-none placeholder:text-grey-500/70"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSearch}
            disabled={!ready || searching || !searchText.trim()}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Search size={16} aria-hidden="true" />
            {searching ? "Searching…" : "Search"}
          </button>
          <button
            type="button"
            onClick={handleLiveLocation}
            disabled={!ready}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-grey-300 px-4 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100 disabled:opacity-50"
          >
            <Crosshair size={16} aria-hidden="true" />
            Pick Live Location
          </button>
        </div>
      </div>

      <div className="relative h-64 w-full overflow-hidden rounded-xl border border-grey-300 bg-grey-100">
        {loadError ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-grey-500">
            <MapPin size={24} aria-hidden="true" />
            <p>Map could not be loaded. You can still paste a Google Maps link above.</p>
          </div>
        ) : (
          <>
            <div ref={mapRef} className="h-full w-full" />
            {!ready && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-grey-100">
                <LoadingSpinner size={24} />
                <p className="text-sm text-grey-500">Loading map…</p>
              </div>
            )}
          </>
        )}
      </div>

      {statusMessage && <p className="text-xs text-grey-500">{statusMessage}</p>}
      <p className="text-xs text-grey-500">
        Start typing to pick a suggested place, click anywhere on the map, drag the marker, or use your live location.
        The Google Maps link above updates automatically.
      </p>
    </div>
  );
}
