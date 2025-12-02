"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Moon, Sun } from "lucide-react";

export interface TeamAttendanceMapItem {
  name: string;
  employeeId?: string;
  status: string | null;
  address: string;
  clockInTime: string | null;
  lat?: number | null;
  lng?: number | null;
  projects?: {
    project_id: string;
    project_name: string;
    status?: string;
    division?: string;
  }[];
}

interface TeamAttendanceMapProps {
  items?: TeamAttendanceMapItem[];
}

// Simple city-to-coordinate mapping (lat, lng)
const getCityCoordinates = (location: string): [number, number] => {
  const cityMap: { [key: string]: [number, number] } = {
    jakarta: [-6.2088, 106.8456],
    bandung: [-6.9175, 107.6191],
    surabaya: [-7.2575, 112.7521],
    medan: [3.5952, 98.6722],
    semarang: [-6.9667, 110.4167],
    makassar: [-5.1477, 119.4327],
    palembang: [-2.9761, 104.7754],
    yogyakarta: [-7.7956, 110.3695],
    bali: [-8.3405, 115.092],
    denpasar: [-8.6705, 115.2126],
  };

  const lower = location.toLowerCase();
  for (const key in cityMap) {
    if (lower.includes(key)) return cityMap[key];
  }
  return [-2.5, 118.0]; // Indonesia center fallback
};

export function TeamAttendanceMap({ items }: TeamAttendanceMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  // Fallback to empty array if items is ever undefined
  // Filter out employees without location data (no lat/lng and no address)
  const safeItems = (items ?? []).filter((item) => {
    // Must have either GPS coordinates OR an address
    const hasCoordinates = item.lat != null && item.lng != null;
    const hasAddress = item.address && item.address.trim().length > 0;
    return hasCoordinates || hasAddress;
  });

  // Geographic bounds roughly covering Indonesia (to limit panning)
  const indonesiaBounds = L.latLngBounds(
    L.latLng(-11.0, 94.0),  // southwest
    L.latLng(6.5, 142.0)    // northeast
  );

  // Calculate distance between two points (Haversine formula in simplified form for small distances)
  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Add custom styles for markers and popups
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .attendance-marker {
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .attendance-marker:hover {
        transform: scale(1.2);
      }
      .attendance-popup .leaflet-popup-content-wrapper {
        border-radius: 8px;
        box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06);
        padding: 0;
      }
      .attendance-popup .leaflet-popup-content {
        margin: 0;
        padding: 6px;
      }
      .attendance-popup .leaflet-popup-tip {
        width: 10px;
        height: 10px;
      }
      /* Allow popup pane to overflow outside map container */
      .leaflet-popup-pane {
        overflow: visible !important;
        z-index: 1000;
      }
      .attendance-popup {
        overflow: visible !important;
      }
      .attendance-marker-pulse {
        animation: pulse 2s infinite;
      }
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-2.5, 118.0],
      zoom: 5,
      maxBounds: indonesiaBounds,
      maxBoundsViscosity: 1.0,
      worldCopyJump: false,
      minZoom: 1,
      maxZoom: 18,
    });

    // Ensure map stays within Indonesia bounds
    map.setMaxBounds(indonesiaBounds);
    
    const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
    });
    tileLayer.addTo(map);

    mapRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);
    tileLayerRef.current = tileLayer;

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  // Switch tile style for dark / light mode
  useEffect(() => {
    if (!tileLayerRef.current) return;
    const url = darkMode
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    tileLayerRef.current.setUrl(url);
  }, [darkMode]);

  // Update markers when items change
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    const layer = markersLayerRef.current;
    layer.clearLayers();

    const bounds: [number, number][] = [];

    // Group employees by base coordinates so we can slightly offset overlapping markers.
    // Prefer real lat/lng from attendance when available; fall back to city-based lookup.
    const grouped = new Map<
      string,
      { lat: number; lng: number; items: TeamAttendanceMapItem[] }
    >();

    safeItems.forEach((p) => {
      const baseLat = p.lat ?? null;
      const baseLng = p.lng ?? null;

      const [lat, lng] =
        baseLat !== null && baseLng !== null
          ? [baseLat, baseLng]
          : getCityCoordinates(p.address);

      const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;

      const existing = grouped.get(key);
      if (existing) {
        existing.items.push(p);
      } else {
        grouped.set(key, { lat, lng, items: [p] });
      }
    });

    // Collect all points with their coordinates
    interface PointData {
      lat: number;
      lng: number;
      item: TeamAttendanceMapItem;
      adjLat: number;
      adjLng: number;
    }

    const allPoints: PointData[] = [];

    // One marker per employee; if multiple share same city, offset them around the base point
    grouped.forEach(({ lat, lng, items }) => {
      const count = items.length;
      // If we had exact coordinates for these items, don't push them too far away;
      // only apply a tiny jitter when there are overlaps. For city-only fallbacks
      // this is also small enough not to push points out to sea.
      const baseRadius = 0.02; // ~2km

      items.forEach((p, index) => {
        const hasExactCoords = p.lat != null && p.lng != null;

        // If only one at this location, or we have exact coordinates, keep it in place.
        const angle = count > 1 ? (2 * Math.PI * index) / count : 0;
        const radius = count > 1 && !hasExactCoords ? baseRadius : 0;

        const adjLat = lat + (radius ? radius * Math.cos(angle) : 0);
        const adjLng = lng + (radius ? radius * Math.sin(angle) : 0);

        bounds.push([adjLat, adjLng]);

        const status = p.status || "No record";
        const time = p.clockInTime
          ? new Date(p.clockInTime).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
          : "-";

        // Use circle markers (purple) - make them more active/visible
        const isOnline =
          status.toLowerCase() === "clocked_in" ||
          status.toLowerCase() === "present" ||
          status.toLowerCase() === "online";

        const marker = L.circleMarker([adjLat, adjLng], {
          radius: 8, // Smaller marker size
          color: "#a855f7", // purple border
          weight: 2,
          fillColor: "#a855f7", // purple fill
          fillOpacity: 0.95,
          className: isOnline ? "attendance-marker-pulse" : "attendance-marker",
        });

        const projectsHtml = (p.projects || [])
          .slice(0, 3) // Show fewer projects for smaller card
          .map(
            (proj) => `
          <div style="margin-top:2px;font-size:10px;color:#4b5563;">
            <span style="font-weight:500;">${proj.project_name}</span>
            ${proj.status ? ` <span style="opacity:0.7;font-size:9px;">(${proj.status})</span>` : ""}
          </div>
        `
          )
          .join("");

        // Store employee name for popup (ensure it's available)
        const employeeName = p.name || "Unknown Employee";
        
        // Smaller, compact profile card - always positioned on the right
        marker.bindPopup(
          `<div style="font-size:11px;max-width:200px;padding:6px;">
          <div style="font-weight:600;margin-bottom:3px;font-size:12px;color:#1f2937;">${employeeName}</div>
          ${p.employeeId ? `<div style="color:#6b7280;font-size:10px;margin-bottom:3px;">ID: ${p.employeeId}</div>` : ""}
          <div style="margin-top:3px;font-size:10px;color:#4b5563;line-height:1.3;">📍 ${p.address || "No address"}</div>
          ${time !== "-" ? `<div style="margin-top:3px;font-size:10px;color:#4b5563;">🕐 ${time}</div>` : ""}
          ${projectsHtml ? `<div style="margin-top:4px;border-top:1px solid #d1d5db;padding-top:4px;"><div style="font-weight:600;margin-bottom:2px;font-size:10px;color:#374151;">Projects:</div>${projectsHtml}</div>` : ""}
          ${status ? `<div style="margin-top:4px;"><span style="padding:2px 6px;border-radius:9999px;background:#ecfdf3;color:#166534;font-weight:500;font-size:9px;">${status}</span></div>` : ""}
        </div>`,
          {
            className: "attendance-popup", // Add class for styling
            maxWidth: 200,
            offset: [15, -50], // Default: right side, vertically centered
            autoPan: false, // Don't auto-pan - allow popup to exceed map bounds
            keepInView: false, // Allow popup to go outside map view
          }
        );

        // Hover interaction: show popup on hover - always on the right side, adjust vertical position
        marker.on("mouseover", () => {
          const map = mapRef.current;
          if (!map) return;
          
          // Calculate marker position relative to map edges
          const point = map.latLngToContainerPoint([adjLat, adjLng]);
          const mapSize = map.getSize();
          
          // Always position popup to the right of the marker
          const offsetX = 15; // Always on the right side
          
          // Adjust vertical position: if marker is near top (would cut off), show below
          let offsetY = -50; // Default: center vertically
          
          // If marker is in top 25% of map, position popup below to avoid cutoff
          if (point.y < mapSize.y * 0.25) {
            offsetY = 20; // Show below the marker
          } else if (point.y > mapSize.y * 0.75) {
            offsetY = -120; // Show above if near bottom
          }
          
          // Update popup offset before opening
          const popup = marker.getPopup();
          if (popup) {
            // Rebind with new offset
            const content = popup.getContent();
            marker.unbindPopup();
            marker.bindPopup(content as string, {
              className: "attendance-popup",
              maxWidth: 200,
              offset: [offsetX, offsetY],
              autoPan: false,
              keepInView: false,
            });
          }
          
          // Open popup directly
          marker.openPopup();
        });

        marker.on("mouseout", () => {
          // Close popup when mouse leaves
          marker.closePopup();
        });

        // Click interaction: zoom in
        marker.on("click", () => {
          mapRef.current?.flyTo([adjLat, adjLng], 16, {
            duration: 0.8,
          });
        });

        marker.addTo(layer);

        // Store point data for line connections
        allPoints.push({ lat, lng, item: p, adjLat, adjLng });
      });
    });

    // Connect points in a chain (a->b->c->d) by nearest neighbors to form a polygon
    if (allPoints.length > 1) {
      const visited = new Set<number>();
      const path: number[] = [];
      
      // Start with the first point
      let currentIndex = 0;
      path.push(currentIndex);
      visited.add(currentIndex);

      // Build the chain by always connecting to the nearest unvisited point
      while (visited.size < allPoints.length) {
        let nearestIndex = -1;
        let nearestDistance = Infinity;

        // Find the nearest unvisited point
        allPoints.forEach((otherPoint, otherIndex) => {
          if (visited.has(otherIndex)) return;

          const distance = getDistance(
            allPoints[currentIndex].adjLat,
            allPoints[currentIndex].adjLng,
            otherPoint.adjLat,
            otherPoint.adjLng
          );

          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = otherIndex;
          }
        });

        // Connect to the nearest unvisited point
        if (nearestIndex !== -1) {
          L.polyline(
            [
              [allPoints[currentIndex].adjLat, allPoints[currentIndex].adjLng],
              [allPoints[nearestIndex].adjLat, allPoints[nearestIndex].adjLng],
            ],
            {
              color: "#f97316", // orange line
              weight: 2,
              opacity: 0.8,
            }
          ).addTo(layer);

          // Move to the next point
          currentIndex = nearestIndex;
          path.push(currentIndex);
          visited.add(currentIndex);
        } else {
          break; // No more unvisited points
        }
      }

      // Close the polygon by connecting the last point back to the first
      if (allPoints.length > 2) {
        L.polyline(
          [
            [allPoints[currentIndex].adjLat, allPoints[currentIndex].adjLng],
            [allPoints[0].adjLat, allPoints[0].adjLng],
          ],
          {
            color: "#f97316", // orange line
            weight: 2,
            opacity: 0.8,
          }
        ).addTo(layer);
      }
    }

    // Fit map to markers (but stay within Indonesia bounds)
    if (bounds.length > 0) {
      const boundsLatLng = L.latLngBounds(bounds);
      // Ensure the bounds are within Indonesia
      const constrainedBounds = indonesiaBounds.extend(boundsLatLng);
      
      mapRef.current.fitBounds(constrainedBounds, {
        padding: [40, 40],
        maxZoom: 7,
      });
      
      // Double-check that map is within bounds after fitting
      mapRef.current.setMaxBounds(indonesiaBounds);
    }
  }, [safeItems]);

  // If no valid items with location data, don't show the map (check after all hooks)
  if (safeItems.length === 0) {
    return null;
  }

  return (
    <div className={`border-b ${darkMode ? "bg-slate-900" : "bg-gray-50"}`} style={{ position: "relative", overflow: "visible" }}>
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className={`w-5 h-5 ${darkMode ? "text-blue-400" : "text-blue-600"}`} />
          <h4 className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            Nusantara Map
          </h4>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
            {safeItems.length} active {safeItems.length === 1 ? "location" : "locations"}
          </span>
          <button
            type="button"
            onClick={() => setDarkMode((v) => !v)}
            className={`p-2 rounded-lg text-xs ${
              darkMode ? "text-gray-300 hover:bg-slate-800" : "text-gray-600 hover:bg-gray-200"
            }`}
            aria-label="Toggle map theme"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div ref={containerRef} style={{ height: "420px", width: "100%", position: "relative" }} />
    </div>
  );
}


