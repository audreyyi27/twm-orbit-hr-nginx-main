"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Moon, Sun } from "lucide-react";

export interface AllTeamsAttendanceMapItem {
  name: string;
  employeeId?: string;
  status: string | null;
  address: string;
  clockInTime: string | null;
  lat?: number | null;
  lng?: number | null;
  teamName: string;
  teamId?: string;
}

interface AllTeamsAttendanceMapProps {
  items?: AllTeamsAttendanceMapItem[];
}

// Color palette for different teams
const TEAM_COLORS = [
  "#ef4444", // red
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
  "#6366f1", // indigo
  "#14b8a6", // teal
  "#a855f7", // violet
];

// Get color for a team (consistent based on team name)
const getTeamColor = (teamName: string, teamIndex: number): string => {
  // Use team index to get consistent color
  return TEAM_COLORS[teamIndex % TEAM_COLORS.length];
};

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

export function AllTeamsAttendanceMap({ items }: AllTeamsAttendanceMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  // Fallback to empty array if items is ever undefined
  // Filter out employees without location data (no lat/lng and no address)
  // AND filter out employees who haven't clocked in
  const safeItems = (items ?? []).filter((item) => {
    // Must have clocked in (has clockInTime)
    const hasClockIn = item.clockInTime != null && item.clockInTime.trim().length > 0;
    if (!hasClockIn) return false;
    
    // Must have either GPS coordinates OR an address
    const hasCoordinates = item.lat != null && item.lng != null;
    const hasAddress = item.address && item.address.trim().length > 0;
    return hasCoordinates || hasAddress;
  });

  // Group items by team to get team colors
  const teamMap = new Map<string, number>();
  let teamIndex = 0;
  safeItems.forEach((item) => {
    if (!teamMap.has(item.teamName)) {
      teamMap.set(item.teamName, teamIndex++);
    }
  });

  // Geographic bounds strictly covering Indonesia (to limit panning)
  const indonesiaBounds = L.latLngBounds(
    L.latLng(-11.0, 94.0),  // southwest
    L.latLng(6.5, 141.0)    // northeast
  );

  // Calculate distance between two points (Haversine formula)
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
      center: [-2.5, 118.0], // Center of Indonesia
      zoom: 5.5, // Slightly zoomed in to better fit Indonesia
      maxBounds: indonesiaBounds,
      maxBoundsViscosity: 0.5, // Softer bounds - allows some movement but gently pulls back
      worldCopyJump: false,
      minZoom: 4,
      maxZoom: 18,
    });

    map.setMaxBounds(indonesiaBounds);
    
    const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
    });
    tileLayer.addTo(map);

    mapRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);
    tileLayerRef.current = tileLayer;

    // Only check bounds on dragend (after dragging is complete) to allow smooth dragging
    map.on('dragend', () => {
      const bounds = map.getBounds();
      const center = map.getCenter();
      
      // Only correct if center is way outside bounds
      if (!indonesiaBounds.contains(center)) {
        const newLat = Math.max(indonesiaBounds.getSouth(), Math.min(indonesiaBounds.getNorth(), center.lat));
        const newLng = Math.max(indonesiaBounds.getWest(), Math.min(indonesiaBounds.getEast(), center.lng));
        map.setView([newLat, newLng], map.getZoom(), { animate: true });
      }
    });

    return () => {
      map.off('dragend');
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

    // Group employees by base coordinates
    const grouped = new Map<
      string,
      { lat: number; lng: number; items: AllTeamsAttendanceMapItem[] }
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

    const allPoints: Array<{
      lat: number;
      lng: number;
      item: AllTeamsAttendanceMapItem;
      adjLat: number;
      adjLng: number;
    }> = [];

    // Create markers for each employee
    grouped.forEach(({ lat, lng, items }) => {
      const count = items.length;
      const baseRadius = 0.02;

      items.forEach((p, index) => {
        const hasExactCoords = p.lat != null && p.lng != null;
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

        const isOnline =
          status.toLowerCase() === "clocked_in" ||
          status.toLowerCase() === "present" ||
          status.toLowerCase() === "online";

        // Get team color
        const teamIndex = teamMap.get(p.teamName) || 0;
        const teamColor = getTeamColor(p.teamName, teamIndex);

        const marker = L.circleMarker([adjLat, adjLng], {
          radius: 8,
          color: teamColor,
          weight: 2,
          fillColor: teamColor,
          fillOpacity: 0.95,
          className: isOnline ? "attendance-marker-pulse" : "attendance-marker",
        });

        const employeeName = p.name || "Unknown Employee";
        
        marker.bindPopup(
          `<div style="font-size:11px;max-width:200px;padding:6px;">
          <div style="font-weight:600;margin-bottom:3px;font-size:12px;color:#1f2937;">${employeeName}</div>
          ${p.employeeId ? `<div style="color:#6b7280;font-size:10px;margin-bottom:3px;">ID: ${p.employeeId}</div>` : ""}
          <div style="color:#6b7280;font-size:10px;margin-bottom:3px;font-weight:500;">Team: ${p.teamName}</div>
          <div style="margin-top:3px;font-size:10px;color:#4b5563;line-height:1.3;">📍 ${p.address || "No address"}</div>
          ${time !== "-" ? `<div style="margin-top:3px;font-size:10px;color:#4b5563;">🕐 ${time}</div>` : ""}
          ${status ? `<div style="margin-top:4px;"><span style="padding:2px 6px;border-radius:9999px;background:#ecfdf3;color:#166534;font-weight:500;font-size:9px;">${status}</span></div>` : ""}
        </div>`,
          {
            className: "attendance-popup",
            maxWidth: 200,
            offset: [15, -50],
            autoPan: false,
            keepInView: false,
          }
        );

        marker.on("mouseover", () => {
          const map = mapRef.current;
          if (!map) return;
          
          const point = map.latLngToContainerPoint([adjLat, adjLng]);
          const mapSize = map.getSize();
          
          const offsetX = 15;
          let offsetY = -50;
          
          if (point.y < mapSize.y * 0.25) {
            offsetY = 20;
          } else if (point.y > mapSize.y * 0.75) {
            offsetY = -120;
          }
          
          const popup = marker.getPopup();
          if (popup) {
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
          
          marker.openPopup();
        });

        marker.on("mouseout", () => {
          marker.closePopup();
        });

        marker.on("click", () => {
          mapRef.current?.flyTo([adjLat, adjLng], 16, {
            duration: 0.8,
          });
        });

        marker.addTo(layer);
        allPoints.push({ lat, lng, item: p, adjLat, adjLng });
      });
    });

    // Connect points by nearest neighbors (only connect within same team)
    const teamGroups = new Map<string, typeof allPoints>();
    allPoints.forEach((point) => {
      const team = point.item.teamName;
      if (!teamGroups.has(team)) {
        teamGroups.set(team, []);
      }
      teamGroups.get(team)!.push(point);
    });

    // Draw lines for each team separately
    teamGroups.forEach((teamPoints, teamName) => {
      if (teamPoints.length <= 1) return;

      const visited = new Set<number>();
      let currentIndex = 0;
      visited.add(currentIndex);

      while (visited.size < teamPoints.length) {
        let nearestIndex = -1;
        let nearestDistance = Infinity;

        teamPoints.forEach((otherPoint, otherIndex) => {
          if (visited.has(otherIndex)) return;

          const distance = getDistance(
            teamPoints[currentIndex].adjLat,
            teamPoints[currentIndex].adjLng,
            otherPoint.adjLat,
            otherPoint.adjLng
          );

          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = otherIndex;
          }
        });

        if (nearestIndex !== -1) {
          const teamIndex = teamMap.get(teamName) || 0;
          const teamColor = getTeamColor(teamName, teamIndex);
          
          L.polyline(
            [
              [teamPoints[currentIndex].adjLat, teamPoints[currentIndex].adjLng],
              [teamPoints[nearestIndex].adjLat, teamPoints[nearestIndex].adjLng],
            ],
            {
              color: teamColor,
              weight: 2,
              opacity: 0.6,
            }
          ).addTo(layer);

          currentIndex = nearestIndex;
          visited.add(currentIndex);
        } else {
          break;
        }
      }

      // Close polygon if more than 2 points
      if (teamPoints.length > 2) {
        const teamIndex = teamMap.get(teamName) || 0;
        const teamColor = getTeamColor(teamName, teamIndex);
        
        L.polyline(
          [
            [teamPoints[currentIndex].adjLat, teamPoints[currentIndex].adjLng],
            [teamPoints[0].adjLat, teamPoints[0].adjLng],
          ],
          {
            color: teamColor,
            weight: 2,
            opacity: 0.6,
          }
        ).addTo(layer);
      }
    });

    // Fit map to markers
    if (bounds.length > 0) {
      const boundsLatLng = L.latLngBounds(bounds);
      
      const constrainedSouth = Math.max(indonesiaBounds.getSouth(), boundsLatLng.getSouth());
      const constrainedWest = Math.max(indonesiaBounds.getWest(), boundsLatLng.getWest());
      const constrainedNorth = Math.min(indonesiaBounds.getNorth(), boundsLatLng.getNorth());
      const constrainedEast = Math.min(indonesiaBounds.getEast(), boundsLatLng.getEast());
      
      const constrainedBounds = L.latLngBounds(
        [constrainedSouth, constrainedWest],
        [constrainedNorth, constrainedEast]
      );
      
      if (constrainedBounds.isValid()) {
        mapRef.current.fitBounds(constrainedBounds, {
          padding: [20, 20], // Smaller padding to fit better
          maxZoom: 6.5, // Limit max zoom to keep Indonesia visible
        });
      } else {
        mapRef.current.fitBounds(indonesiaBounds, {
          padding: [20, 20], // Smaller padding
          maxZoom: 5.5, // Better initial zoom for Indonesia
        });
      }
      
      mapRef.current.setMaxBounds(indonesiaBounds);
    }
  }, [safeItems, teamMap]);

  if (safeItems.length === 0) {
    return null;
  }

  return (
    <div className={`border-b ${darkMode ? "bg-slate-900" : "bg-gray-50"}`} style={{ position: "relative", overflow: "visible" }}>
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className={`w-5 h-5 ${darkMode ? "text-blue-400" : "text-blue-600"}`} />
          <h4 className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            All Teams Map
          </h4>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
            {safeItems.length} active {safeItems.length === 1 ? "member" : "members"} from {teamMap.size} {teamMap.size === 1 ? "team" : "teams"}
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
      <div ref={containerRef} style={{ height: "700px", width: "100%", position: "relative" }} />
    </div>
  );
}

