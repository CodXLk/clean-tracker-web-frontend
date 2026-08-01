"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { loadGoogleMaps } from "@/features/user-management/lib/googleMaps";
import type { AttendanceLog } from "@/features/attendance/schemas/attendance.schema";

interface AttendanceMapModalProps {
  open: boolean;
  onClose: () => void;
  log: AttendanceLog | null;
}

export function AttendanceMapModal({ open, onClose, log }: AttendanceMapModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  const checkInLat = log?.checkInLatitude ?? null;
  const checkInLng = log?.checkInLongitude ?? null;
  const siteLat = log?.siteLatitude ?? null;
  const siteLng = log?.siteLongitude ?? null;

  useEffect(() => {
    if (!open || !log) return;
    let cancelled = false;
    setReady(false);
    setError(false);

    // Prefer the check-in point; fall back to the site center.
    const center =
      checkInLat != null && checkInLng != null
        ? { lat: checkInLat, lng: checkInLng }
        : siteLat != null && siteLng != null
          ? { lat: siteLat, lng: siteLng }
          : null;

    if (!center) {
      setError(true);
      return;
    }

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !mapRef.current) return;
        const map = new maps.Map(mapRef.current, {
          center,
          zoom: 17,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        // Site geofence circle.
        if (siteLat != null && siteLng != null) {
          new maps.Marker({
            position: { lat: siteLat, lng: siteLng },
            map,
            title: log.siteName,
            icon: {
              path: maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: "#0B585A",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });
        }

        // Check-in location marker.
        if (checkInLat != null && checkInLng != null) {
          new maps.Marker({
            position: { lat: checkInLat, lng: checkInLng },
            map,
            title: `${log.cleanerName ?? "Cleaner"} check-in`,
          });
        }

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
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, log?.id]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={log ? `${log.cleanerName ?? "Cleaner"} · ${log.siteName}` : "Attendance location"}
      description="Blue dot is the site location; the pin is where the cleaner checked in."
    >
      <div className="relative h-80 w-full overflow-hidden rounded-xl border border-grey-200 bg-grey-50">
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-grey-500">
            No location coordinates were recorded for this check-in.
          </div>
        )}
        <div ref={mapRef} className="h-full w-full" />
      </div>
    </Modal>
  );
}
