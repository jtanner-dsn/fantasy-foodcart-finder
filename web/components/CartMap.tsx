'use client';

import { useEffect, useRef } from 'react';
import { Cart } from '@/lib/api';
import { MAP_BOUNDS } from './MapPicker';

interface CartMapProps {
  carts: Cart[];
  selectedId?: string | null;
  onSelect: (cartId: string) => void;
}

export default function CartMap({ carts, selectedId, onSelect }: CartMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const markersRef = useRef<Map<string, import('leaflet').Marker>>(new Map());

  // Initialise map once
  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;
    if (mapRef.current) return;

    let cancelled = false;

    import('leaflet').then((L) => {
      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        crs: L.CRS.Simple,
        minZoom: -2,
        maxZoom: 2,
        zoomSnap: 0.25,
      });

      L.imageOverlay('/maps/Misthaven-normal.png', MAP_BOUNDS).addTo(map);
      map.fitBounds(MAP_BOUNDS);

      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // Sync cart pins whenever carts or selectedId change
  useEffect(() => {
    if (!mapRef.current) return;

    let cancelled = false;

    import('leaflet').then((L) => {
      if (cancelled || !mapRef.current) return;

      const map = mapRef.current;
      const existing = markersRef.current;

      // Remove markers for carts no longer in the list
      const incomingIds = new Set(carts.map((c) => c.id));
      existing.forEach((marker, id) => {
        if (!incomingIds.has(id)) {
          marker.remove();
          existing.delete(id);
        }
      });

      const openIcon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;border-radius:50%;background:#f59e0b;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.5)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      const closedIcon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;border-radius:50%;background:#6b7280;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.5)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      const selectedIcon = L.divIcon({
        className: '',
        html: `<div style="width:18px;height:18px;border-radius:50%;background:#f59e0b;border:3px solid #fff;box-shadow:0 0 0 2px #f59e0b"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      for (const cart of carts) {
        if (cart.location_x === null || cart.location_y === null) continue;

        const isSelected = cart.id === selectedId;
        const icon = isSelected ? selectedIcon : cart.is_open ? openIcon : closedIcon;
        const latlng: [number, number] = [cart.location_y, cart.location_x];

        if (existing.has(cart.id)) {
          const m = existing.get(cart.id)!;
          m.setLatLng(latlng);
          m.setIcon(icon);
        } else {
          const m = L.marker(latlng, { icon })
            .addTo(map)
            .bindTooltip(cart.name, { permanent: false, direction: 'top', offset: [0, -8] });
          m.on('click', () => onSelect(cart.id));
          existing.set(cart.id, m);
        }
      }
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carts, selectedId]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-xl border border-stone-700 overflow-hidden"
    />
  );
}
