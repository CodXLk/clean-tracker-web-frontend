"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils/cn";
import { loadGoogleMaps } from "@/features/user-management/lib/googleMaps";
import { useSites } from "@/features/user-management/hooks/useSites";
import { useAttendanceLogs } from "@/features/attendance/hooks/useAttendance";
import type { AttendanceLog } from "@/features/attendance/schemas/attendance.schema";
import { todayISODate } from "@/lib/utils/format";

type Audience = "cleaners" | "supervisors";

interface LiveLocationMapProps {
  audience: Audience;
}

// A distinct, high-contrast colour per site — cycled if there are more sites than colours.
const SITE_COLORS = [
  "#0B585A",
  "#ED5F25",
  "#7C3AED",
  "#2563EB",
  "#059669",
  "#DB2777",
  "#D97706",
  "#0891B2",
  "#65A30D",
  "#DC2626",
];

/** "on shift" = currently checked in (or paused), i.e. their shift has started. */
const ON_SHIFT = new Set(["CHECKED_IN", "PAUSED"]);

function actorCoords(log: AttendanceLog): { lat: number; lng: number } | null {
  if (log.lastPingLatitude != null && log.lastPingLongitude != null) {
    return { lat: log.lastPingLatitude, lng: log.lastPingLongitude };
  }
  if (log.checkInLatitude != null && log.checkInLongitude != null) {
    return { lat: log.checkInLatitude, lng: log.checkInLongitude };
  }
  return null;
}

/**
 * Live map of on-shift actors (cleaners or supervisors) for today. Each site is drawn as a
 * coloured geofence circle; every checked-in person appears as a pin tinted to their site.
 */
export function LiveLocationMap({ audience }: LiveLocationMapProps) {
  const today = todayISODate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObjRef = useRef<GoogleMap | null>(null);
  const overlaysRef = useRef<Array<{ setMap: (m: GoogleMap | null) => void }>>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sitesQuery = useSites();
  const logsQuery = useAttendanceLogs({ from: today, to: today });

  const role = audience === "cleaners" ? "CLEANER" : "SUPERVISOR";

  const sites = useMemo(() => sitesQuery.data ?? [], [sitesQuery.data]);
  const colorBySite = useMemo(() => {
    const map = new Map<string, string>();
    sites.forEach((s, i) => map.set(s.id, SITE_COLORS[i % SITE_COLORS.length]!));
    return map;
  }, [sites]);

  // On-shift actors for this audience with usable coordinates.
  const actors = useMemo(
    () =>
      (logsQuery.data ?? [])
        .filter((l) => l.actorRole === role && ON_SHIFT.has(l.status))
        .map((l) => ({ log: l, coords: actorCoords(l) }))
        .filter((a): a is { log: AttendanceLog; coords: { lat: number; lng: number } } => a.coords !== null),
    [logsQuery.data, role],
  );

  // Per-site on-shift counts for the legend.
  const countsBySite = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of actors) map.set(a.log.siteId, (map.get(a.log.siteId) ?? 0) + 1);
    return map;
  }, [actors]);

  const dataLoading = sitesQuery.isLoading || logsQuery.isLoading;

  useEffect(() => {
    if (dataLoading) return;
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !mapRef.current) return;
        setError(null);

        // Clear previous overlays before redrawing.
        overlaysRef.current.forEach((o) => o.setMap(null));
        overlaysRef.current = [];

        const bounds = new maps.LatLngBounds();
        let hasPoint = false;

        if (!mapObjRef.current) {
          mapObjRef.current = new maps.Map(mapRef.current, {
            center: { lat: -33.8688, lng: 151.2093 },
            zoom: 12,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          });
        }
        const map = mapObjRef.current;

        // Sites: coloured geofence circle + centre marker.
        for (const site of sites) {
          if (site.latitude == null || site.longitude == null) continue;
          const center = { lat: site.latitude, lng: site.longitude };
          const color = colorBySite.get(site.id) ?? "#0B585A";
          const circle = new maps.Circle({
            center,
            radius: site.geofenceRadiusMeters ?? 100,
            map,
            strokeColor: color,
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: color,
            fillOpacity: 0.12,
            clickable: false,
          });
          overlaysRef.current.push(circle);
          const marker = new maps.Marker({
            position: center,
            map,
            title: site.name,
            icon: {
              path: maps.SymbolPath.CIRCLE,
              scale: 5,
              fillColor: color,
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });
          overlaysRef.current.push(marker);
          bounds.extend(center);
          hasPoint = true;
        }

        // Actors: pin tinted to their site.
        for (const { log, coords } of actors) {
          const color = colorBySite.get(log.siteId) ?? "#111827";
          const marker = new maps.Marker({
            position: coords,
            map,
            title: `${log.cleanerName ?? "On shift"} · ${log.siteName}`,
            icon: {
              path: maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: color,
              fillOpacity: 0.95,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });
          overlaysRef.current.push(marker);
          bounds.extend(coords);
          hasPoint = true;
        }

        if (hasPoint && !bounds.isEmpty()) {
          map.fitBounds(bounds, 64);
        }

        requestAnimationFrame(() => {
          if (cancelled) return;
          maps.event.trigger(map, "resize");
          setReady(true);
        });
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load the map.");
      });

    return () => {
      cancelled = true;
    };
  }, [dataLoading, sites, actors, colorBySite]);

  const sitesWithActors = sites.filter((s) => (countsBySite.get(s.id) ?? 0) > 0);

  return (
    <div className="flex flex-col gap-4">
      {dataLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size={28} />
        </div>
      ) : error ? (
        <EmptyState title="Map unavailable" description={error} />
      ) : (
        <>
          <div className="relative h-[28rem] w-full overflow-hidden rounded-2xl border border-grey-200 bg-grey-50">
            {!ready && (
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <LoadingSpinner />
              </div>
            )}
            <div ref={mapRef} className="h-full w-full" />
          </div>

          {/* Legend */}
          <div className="rounded-2xl border border-grey-200 bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-grey-500">
              On shift now ({actors.length})
            </p>
            {sitesWithActors.length === 0 ? (
              <p className="text-sm text-grey-500">
                No {audience === "cleaners" ? "cleaners" : "supervisors"} are checked in right now.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                {sitesWithActors.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 text-sm text-on-surface">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: colorBySite.get(s.id) }}
                    />
                    <span className="font-medium">{s.name}</span>
                    <span className={cn("rounded-full bg-grey-100 px-2 py-0.5 text-xs text-grey-600")}>
                      {countsBySite.get(s.id)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
