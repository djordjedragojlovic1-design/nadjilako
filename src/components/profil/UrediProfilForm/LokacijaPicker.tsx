"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type {
  DivIcon,
  Map as LeafletMap,
  Marker as LeafletMarker,
} from "leaflet";
import { extractMapsCoords } from "@/lib/lokacije/maps";

type Coords = { lat: number; lng: number };

type LokacijaPickerProps = {
  value: string;
  onPick: (coords: Coords) => void;
};

const DEFAULT_CENTER: Coords = { lat: 42.5, lng: 19.3 };
const DEFAULT_ZOOM = 7;
const SELECTED_ZOOM = 15;

const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="42" viewBox="0 0 24 36"><path fill="#ef4444" stroke="#fff" stroke-width="1.5" d="M12 .75C5.94.75 1 5.69 1 11.75c0 7.9 9.6 22 10.01 22.6a1.2 1.2 0 0 0 1.98 0C13.4 33.75 23 19.65 23 11.75 23 5.69 18.06.75 12 .75Z"/><circle cx="12" cy="11.75" r="4" fill="#fff"/></svg>`;

export function LokacijaPicker({ value, onPick }: LokacijaPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const iconRef = useRef<DivIcon | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || mapRef.current || !containerRef.current) return;

      const icon = L.divIcon({
        className: "border-0 bg-transparent",
        html: PIN_SVG,
        iconSize: [30, 42],
        iconAnchor: [15, 42],
      });
      iconRef.current = icon;

      const initial = extractMapsCoords(value);
      const center = initial ?? DEFAULT_CENTER;

      const map = L.map(containerRef.current).setView(
        [center.lat, center.lng],
        initial ? SELECTED_ZOOM : DEFAULT_ZOOM,
      );
      mapRef.current = map;

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const placeMarker = (coords: Coords) => {
        if (markerRef.current) {
          markerRef.current.setLatLng([coords.lat, coords.lng]);
          return;
        }
        const marker = L.marker([coords.lat, coords.lng], {
          draggable: true,
          icon,
        }).addTo(map);
        marker.on("dragend", () => {
          const p = marker.getLatLng();
          onPickRef.current({ lat: p.lat, lng: p.lng });
        });
        markerRef.current = marker;
      };

      if (initial) placeMarker(initial);

      map.on("click", (e) => {
        const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
        placeMarker(coords);
        onPickRef.current(coords);
      });

      setTimeout(() => map.invalidateSize(), 0);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const coords = extractMapsCoords(value);
    if (!coords) return;

    const current = markerRef.current?.getLatLng();
    if (
      current &&
      Math.abs(current.lat - coords.lat) < 1e-6 &&
      Math.abs(current.lng - coords.lng) < 1e-6
    ) {
      return;
    }

    void (async () => {
      const L = (await import("leaflet")).default;
      const activeMap = mapRef.current;
      if (!activeMap) return;

      if (markerRef.current) {
        markerRef.current.setLatLng([coords.lat, coords.lng]);
      } else {
        const marker = L.marker([coords.lat, coords.lng], {
          draggable: true,
          icon: iconRef.current ?? undefined,
        }).addTo(activeMap);
        marker.on("dragend", () => {
          const p = marker.getLatLng();
          onPickRef.current({ lat: p.lat, lng: p.lng });
        });
        markerRef.current = marker;
      }

      activeMap.setView(
        [coords.lat, coords.lng],
        Math.max(activeMap.getZoom(), SELECTED_ZOOM),
      );
    })();
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="relative z-0 h-72 w-full overflow-hidden rounded-lg border"
    />
  );
}
