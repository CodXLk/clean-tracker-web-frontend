// Minimal ambient declarations for the subset of the Google Maps JavaScript API
// used by the Site location picker. The full API is loaded at runtime from Google;
// we only type the pieces we actually call to keep strict mode happy without pulling
// in the heavy @types/google.maps package.

interface GoogleLatLng {
  lat(): number;
  lng(): number;
}

interface GoogleLatLngLiteral {
  lat: number;
  lng: number;
}

interface GoogleMapMouseEvent {
  latLng: GoogleLatLng | null;
}

interface GoogleMapOptions {
  center: GoogleLatLngLiteral;
  zoom: number;
  mapTypeControl?: boolean;
  streetViewControl?: boolean;
  fullscreenControl?: boolean;
}

interface GoogleMap {
  setCenter(latLng: GoogleLatLngLiteral): void;
  setZoom(zoom: number): void;
  panTo(latLng: GoogleLatLngLiteral): void;
  addListener(eventName: string, handler: (event: GoogleMapMouseEvent) => void): void;
}

interface GoogleMarkerOptions {
  position: GoogleLatLngLiteral;
  map: GoogleMap;
  draggable?: boolean;
}

interface GoogleMarker {
  setPosition(latLng: GoogleLatLngLiteral): void;
  setMap(map: GoogleMap | null): void;
  getPosition(): GoogleLatLng | undefined;
  addListener(eventName: string, handler: (event: GoogleMapMouseEvent) => void): void;
}

interface GoogleGeocoderResult {
  geometry: { location: GoogleLatLng };
  formatted_address: string;
}

interface GoogleGeocoder {
  geocode(
    request: { address?: string; location?: GoogleLatLngLiteral },
    callback: (results: GoogleGeocoderResult[] | null, status: string) => void,
  ): void;
}

interface GooglePlaceResult {
  geometry?: { location?: GoogleLatLng };
  formatted_address?: string;
  name?: string;
}

interface GoogleAutocompleteOptions {
  fields?: string[];
  types?: string[];
  componentRestrictions?: { country: string | string[] };
}

interface GoogleAutocomplete {
  addListener(eventName: string, handler: () => void): void;
  getPlace(): GooglePlaceResult;
}

interface GooglePlacesNamespace {
  Autocomplete: new (
    input: HTMLInputElement,
    options?: GoogleAutocompleteOptions,
  ) => GoogleAutocomplete;
}

interface GoogleMapsEventNamespace {
  clearInstanceListeners(instance: object): void;
  trigger(instance: object, eventName: string): void;
}

interface GoogleMapsNamespace {
  Map: new (element: HTMLElement, options: GoogleMapOptions) => GoogleMap;
  Marker: new (options: GoogleMarkerOptions) => GoogleMarker;
  Geocoder: new () => GoogleGeocoder;
  places: GooglePlacesNamespace;
  event: GoogleMapsEventNamespace;
}

interface Window {
  google?: { maps: GoogleMapsNamespace };
  [key: `__primewayGoogleMaps${string}`]: (() => void) | undefined;
}
