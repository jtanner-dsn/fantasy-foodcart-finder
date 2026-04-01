'use client';

import { useEffect, useRef } from 'react';

// The map image is 4096×4096 px. CRS.Simple treats pixels as coordinate units.
export const MAP_BOUNDS: [[number, number], [number, number]] = [[0, 0], [4096, 4096]];
export const MAP_CENTER: [number, number] = [2048, 2048];

interface MapPickerProps {
  value: { x: number | null; y: number | null };
  onChange: (coords: { x: number; y: number }) => void;
}

export default function MapPicker({ value, onChange }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Refs to hold live Leaflet objects without triggering re-renders
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const markerRef = useRef<import('leaflet').Marker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;
    if (mapRef.current) return; // already initialised

    // Dynamic import so Leaflet only runs client-side
    import('leaflet').then((L) => {
      // Override default icon paths (Next.js doesn't serve them from the default location)
      const DefaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      const map = L.map(containerRef.current!, {
        crs: L.CRS.Simple,
        minZoom: -2,
        maxZoom: 2,
        zoomSnap: 0.25,
      });

      L.imageOverlay('/maps/Misthaven-normal.png', MAP_BOUNDS).addTo(map);
      map.fitBounds(MAP_BOUNDS);

      // Place existing marker if we have a saved location
      if (value.x !== null && value.y !== null) {
        const m = L.marker([value.y, value.x] as [number, number], { icon: DefaultIcon }).addTo(map);
        markerRef.current = m;
      }

      // Click to place / move marker
      map.on('click', (e: import('leaflet').LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        const coords = { x: lng, y: lat };

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng] as [number, number], { icon: DefaultIcon }).addTo(map);
        }

        onChange(coords);
      });

      mapRef.current = map;
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes (e.g. "clear location")
  useEffect(() => {
    if (!mapRef.current) return;
    import('leaflet').then((L) => {
      if (value.x === null || value.y === null) {
        markerRef.current?.remove();
        markerRef.current = null;
      } else if (markerRef.current) {
        markerRef.current.setLatLng([value.y as number, value.x as number]);
      }
    });
  }, [value.x, value.y]);

  return (
    <div className="space-y-1">
      <p className="text-xs text-stone-400">Click on the map to drop a pin for your stall&apos;s location.</p>
      <div
        ref={containerRef}
        className="h-72 w-full rounded-lg border border-stone-600 overflow-hidden"
      />
      {value.x !== null && value.y !== null && (
        <p className="text-xs text-stone-500">
          Pin at ({Math.round(value.x)}, {Math.round(value.y)})
        </p>
      )}
    </div>
  );
}
