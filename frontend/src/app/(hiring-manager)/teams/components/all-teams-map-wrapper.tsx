'use client';

import { useEffect, useState } from 'react';
import dynamicImport from "next/dynamic";
import type { AllTeamsAttendanceMapItem } from "./all-teams-attendance-map";
import type { TeamWithDetailsDto } from "@/core/projects/dto";
import { BASE_URL } from "@/core/utils/constant/base";

// Dynamically import AllTeamsAttendanceMap with SSR disabled
const AllTeamsAttendanceMap = dynamicImport(
  () => import("./all-teams-attendance-map").then((mod) => ({ default: mod.AllTeamsAttendanceMap })),
  { ssr: false }
);

export default function AllTeamsMapWrapper() {
  const [mapItems, setMapItems] = useState<AllTeamsAttendanceMapItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllTeamsAttendance = async () => {
      try {
        setLoading(true);
        
        // Get auth token
        const authRes = await fetch("/api/auth/get-token", {
          credentials: "include",
        });
        
        if (!authRes.ok) {
          throw new Error("Failed to get authentication token");
        }
        
        const { token } = await authRes.json();
        if (!token) {
          throw new Error("No authentication token available");
        }

        // Fetch all teams
        const backendUrl = BASE_URL || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
        const teamsRes = await fetch(`${backendUrl}/teams/with-details`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!teamsRes.ok) {
          throw new Error("Failed to fetch teams");
        }

        const teamsData = await teamsRes.json();
        const teams: TeamWithDetailsDto[] = Array.isArray(teamsData) ? teamsData : (teamsData.items || []);

        // Fetch today's date
        const today = new Date().toISOString().split('T')[0];

        // Fetch attendance for all teams in parallel
        const attendancePromises = teams.map(async (team: TeamWithDetailsDto) => {
          const teamName = team.team?.team_name;
          if (!teamName) return [];

          try {
            const attendanceRes = await fetch(
              `${backendUrl}/attendance/team/${encodeURIComponent(teamName)}/attendance?date=${today}`,
              {
                headers: {
                  "Authorization": `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                credentials: "include",
              }
            );

            if (!attendanceRes.ok) return [];

            const attendanceData = await attendanceRes.json();
            const members = attendanceData.members || [];

            // Transform to map items
            return members
              .filter((member: any) => member.attendance && member.attendance.clock_in_time)
              .map((member: any) => ({
                name: member.name || 'Unknown',
                employeeId: member.employee_id || undefined,
                status: member.attendance?.status || null,
                address: member.attendance?.clock_in_address || member.attendance?.clock_out_address || 'No address',
                clockInTime: member.attendance?.clock_in_time || null,
                lat: member.attendance?.clock_in_latitude || member.attendance?.clock_out_latitude || null,
                lng: member.attendance?.clock_in_longitude || member.attendance?.clock_out_longitude || null,
                teamName: teamName,
                teamId: member.team_id || undefined,
              }));
          } catch (error) {
            console.error(`Error fetching attendance for team ${teamName}:`, error);
            return [];
          }
        });

        // Wait for all requests to complete in parallel
        const allResults = await Promise.all(attendancePromises);
        const allMapItems = allResults.flat();

        setMapItems(allMapItems);
      } catch (error) {
        console.error("Error fetching all teams attendance:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllTeamsAttendance();
  }, []);

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (mapItems.length === 0) {
    return null; // Don't show map if no items
  }

  return <AllTeamsAttendanceMap items={mapItems} />;
}

