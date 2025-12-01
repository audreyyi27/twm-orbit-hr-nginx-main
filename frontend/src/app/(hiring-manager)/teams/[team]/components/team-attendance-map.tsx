"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap, LngLatBounds, LayerSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin, Moon, Sun } from "lucide-react";

export interface TeamAttendanceMapItem {
  name: string;
  employeeId?: string;
  status: string | null;
  address: string;
  clockInTime: string | null;
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
  const mapRef = useRef<MapLibreMap | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  // Fallback to empty array if items is ever undefined
  const safeItems = items ?? [];
  // console.log("TeamAttendanceMap safeItems", safeItems.length, safeItems.map(i => i.name));

  // Jakarta HQ (lat, lng) – MapLibre expects [lng, lat]
  const jakartaHQLatLng: [number, number] = [-6.2088, 106.8456];
  const jakartaHQLngLat: [number, number] = [jakartaHQLatLng[1], jakartaHQLatLng[0]];

  // Initialize MapLibre map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [118.0, -2.5], // [lng, lat]
      zoom: 4.5,
    });

    // Disable rotation for a simpler experience
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers and lines when items change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateLayers = () => {
      // Remove any existing layers/sources we added in a previous render
      const existingLayers = map.getStyle()?.layers || [];
      existingLayers.forEach((layer: LayerSpecification) => {
        if (layer.id.startsWith("team-attendance-markers") || layer.id.startsWith("team-attendance-lines")) {
          if (map.getLayer(layer.id)) {
            map.removeLayer(layer.id);
          }
        }
      });
      const existingSources = map.getStyle()?.sources || {};
      Object.keys(existingSources).forEach((sourceId) => {
        if (sourceId.startsWith("team-attendance-markers") || sourceId.startsWith("team-attendance-lines")) {
          if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
          }
        }
      });

      if (safeItems.length === 0) return;

      // Group employees by base coordinates so we can slightly offset overlapping markers
      const grouped = new Map<
        string,
        { lat: number; lng: number; items: TeamAttendanceMapItem[] }
      >();

      safeItems.forEach((p) => {
        const [lat, lng] = getCityCoordinates(p.address);
        const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;

        const existing = grouped.get(key);
        if (existing) {
          existing.items.push(p);
        } else {
          grouped.set(key, { lat, lng, items: [p] });
        }
      });

      const markerFeatures: any[] = [];
      const lineFeatures: any[] = [];
      const bounds = new LngLatBounds();

      grouped.forEach(({ lat, lng, items }) => {
        const count = items.length;
        const radius = 0.15; // ~15km offset to ensure visibility even when zoomed out

        items.forEach((p, index) => {
          // If only one at this location, no offset
          const angle = count > 1 ? (2 * Math.PI * index) / count : 0;
          const adjLat = lat + (count > 1 ? radius * Math.cos(angle) : 0);
          const adjLng = lng + (count > 1 ? radius * Math.sin(angle) : 0);

          const point: [number, number] = [adjLng, adjLat]; // [lng, lat]
          bounds.extend(point);

          markerFeatures.push({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: point,
            },
            properties: {
              name: p.name,
              employeeId: p.employeeId ?? "",
              address: p.address ?? "",
              status: p.status ?? "No record",
              clockInTime: p.clockInTime ?? "",
            },
          });

          lineFeatures.push({
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [jakartaHQLngLat, point],
            },
          });
        });
      });

      if (markerFeatures.length === 0) return;

      // Add markers as a circle layer
      const markerSourceId = "team-attendance-markers-source";
      const markerLayerId = "team-attendance-markers-layer";
      map.addSource(markerSourceId, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: markerFeatures,
        },
      });
      map.addLayer({
        id: markerLayerId,
        type: "circle",
        source: markerSourceId,
        paint: {
          "circle-radius": 8,
          "circle-color": "#a855f7", // purple
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.5,
        },
      });

      // Add lines from HQ to each employee
      const lineSourceId = "team-attendance-lines-source";
      const lineLayerId = "team-attendance-lines-layer";
      map.addSource(lineSourceId, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: lineFeatures,
        },
      });
      map.addLayer({
        id: lineLayerId,
        type: "line",
        source: lineSourceId,
        paint: {
          "line-color": "#f97316", // orange
          "line-width": 2,
          "line-opacity": 0.8,
        },
      });

      // Fit bounds to all points
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, {
          padding: 40,
          maxZoom: 7,
          duration: 500,
        });
      }
    };

    if (map.isStyleLoaded()) {
      updateLayers();
    } else {
      map.once("load", updateLayers);
    }

    // Cleanup: remove our layers/sources on unmount or before next update
    return () => {
      const currentMap = mapRef.current;
      if (!currentMap) return;

      const markerSourceId = "team-attendance-markers-source";
      const markerLayerId = "team-attendance-markers-layer";
      const lineSourceId = "team-attendance-lines-source";
      const lineLayerId = "team-attendance-lines-layer";

      if (currentMap.getLayer(markerLayerId)) currentMap.removeLayer(markerLayerId);
      if (currentMap.getLayer(lineLayerId)) currentMap.removeLayer(lineLayerId);
      if (currentMap.getSource(markerSourceId)) currentMap.removeSource(markerSourceId);
      if (currentMap.getSource(lineSourceId)) currentMap.removeSource(lineSourceId);
    };
  }, [safeItems]);

  return (
    <div className={`border-b ${darkMode ? "bg-slate-900" : "bg-gray-50"}`}>
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
      <div ref={containerRef} style={{ height: "420px", width: "100%" }} />
    </div>
  );
}


