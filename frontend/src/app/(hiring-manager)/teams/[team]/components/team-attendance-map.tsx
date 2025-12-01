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

// Simple city-to-coordinate mapping
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
  const safeItems = items ?? [];

  // Geographic bounds roughly covering Indonesia (to limit panning)
  const indonesiaBounds = L.latLngBounds(
    L.latLng(-11.0, 94.0),  // southwest
    L.latLng(6.5, 142.0)    // northeast
  );

  // Jakarta HQ (headquarter) - used as origin for lines
  const jakartaHQ: [number, number] = [-6.2088, 106.8456];

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-2.5, 118.0],
      zoom: 5,
      maxBounds: indonesiaBounds,
      maxBoundsViscosity: 1.0,
      worldCopyJump: false,
    });
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

    // One marker per employee; draw line from Jakarta HQ to each location
    safeItems.forEach((p) => {
      const [lat, lng] = getCityCoordinates(p.address);
      bounds.push([lat, lng]);

      const status = p.status || "No record";
      const time = p.clockInTime
        ? new Date(p.clockInTime).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
        : "-";

      // Use circle markers (no image icons → no broken image)
      const isOnline =
        status.toLowerCase() === "clocked_in" ||
        status.toLowerCase() === "present" ||
        status.toLowerCase() === "online";

      const marker = L.circleMarker([lat, lng], {
        radius: 6,
        color: isOnline ? "#f97316" : "#6b7280", // orange border when active, gray otherwise
        weight: 2,
        fillColor: isOnline ? "#f97316" : "#6b7280",
        fillOpacity: 0.9,
        className: isOnline ? "attendance-marker-pulse" : "",
      });

      const projectsHtml = (p.projects || [])
        .slice(0, 3)
        .map(
          (proj) => `
          <div style="margin-top:2px;font-size:11px;color:#e5e7eb;">
            <span style="font-weight:600;">${proj.project_name}</span>
            ${proj.status ? ` <span style="opacity:0.8;">(${proj.status})</span>` : ""}
          </div>
        `
        )
        .join("");

      marker.bindPopup(
        `<div style="font-size:12px;max-width:220px;">
          <div style="font-weight:600;">${p.name}</div>
          ${p.employeeId ? `<div style="color:#e5e7eb;">${p.employeeId}</div>` : ""}
          <div style="margin-top:4px;font-size:11px;color:#e5e7eb;">${p.address}</div>
          <div style="margin-top:2px;font-size:11px;color:#e5e7eb;">Clock in: ${time}</div>
          ${projectsHtml ? `<div style="margin-top:4px;border-top:1px solid #4b5563;padding-top:4px;">${projectsHtml}</div>` : ""}
          <div style="margin-top:4px;">
            <span style="padding:2px 6px;border-radius:9999px;background:#ecfdf3;color:#166534;font-weight:500;font-size:11px;">
              ${status}
            </span>
          </div>
        </div>`
      );

      marker.addTo(layer);

      // Draw polyline from HQ to this employee
      L.polyline([jakartaHQ, [lat, lng]], {
        color: "#22c55e",
        weight: 2,
        opacity: 0.7,
      }).addTo(layer);
    });

    // Fit map to markers (but stay within Indonesia bounds)
    if (bounds.length > 0) {
      mapRef.current.fitBounds(bounds as L.LatLngBoundsExpression, {
        padding: [40, 40],
        maxZoom: 8,
      });
    }
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


