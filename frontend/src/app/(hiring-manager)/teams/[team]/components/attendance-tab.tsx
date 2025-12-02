"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";
import { getEmployeeAttendance } from "@/core/employees/attendance_api";
import type { AttendanceDto, EmployeeProjectDto, EmployeeDto } from "@/core/employees/dto";
import { BASE_URL } from "@/core/utils/constant/base";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AttendanceTabProps {
  teamName: string;
}

interface TeamMemberAttendance {
  employee: EmployeeProjectDto;
  attendance: AttendanceDto | null;
}

// Dynamically import the Leaflet map (client-only)
const TeamAttendanceMap = dynamic(
  () => import("./team-attendance-map").then((mod) => mod.TeamAttendanceMap),
  { ssr: false, loading: () => null }
);

export default function AttendanceTab({ teamName }: AttendanceTabProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [members, setMembers] = useState<EmployeeProjectDto[]>([]);
  const [attendanceData, setAttendanceData] = useState<TeamMemberAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch team members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setLoading(true);
        setError(null);
        
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
        
        const backendUrl = BASE_URL || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
        const url = `${backendUrl}/employees/teams/${encodeURIComponent(teamName)}/projects`;
        
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch team members: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        const teamData = data.items || data;
        if (teamData && typeof teamData === 'object' && 'members' in teamData && Array.isArray(teamData.members)) {
          setMembers(teamData.members);
        } else {
          setMembers([]);
        }
      } catch (err) {
        console.error('Error fetching team members:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch team members');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, [teamName]);

  // Fetch attendance for selected date
  useEffect(() => {
    const fetchAttendance = async () => {
      if (members.length === 0) return;

      try {
        setLoading(true);
        setError(null);

        const dateStr = selectedDate.toISOString().split('T')[0];

        const attendancePromises = members.map(async (member) => {
            try {
              let ntAccount: string | undefined;
              
              const memberAny = member as any;
              if (memberAny.nt_account) {
                ntAccount = memberAny.nt_account;
              } else {
                try {
                  const authRes = await fetch("/api/auth/get-token", {
                    credentials: "include",
                  });
                  
                  if (authRes.ok) {
                    const { token } = await authRes.json();
                    if (token) {
                      const backendUrl = BASE_URL || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
                      const empRes = await fetch(`${backendUrl}/employees/${member.uuid}`, {
                        headers: {
                          "Authorization": `Bearer ${token}`,
                          "Content-Type": "application/json",
                        },
                        credentials: "include",
                      });
                      
                      if (empRes.ok) {
                        const empData = await empRes.json();
                        const employee = (empData.items || empData) as EmployeeDto;
                        ntAccount = employee.nt_account;
                      }
                    }
                  }
                } catch (err) {
                  console.warn(`Failed to fetch employee data for ${member.name}:`, err);
                }
              }
              
              if (!ntAccount) {
                return { employee: member, attendance: null };
              }
              
              const response = await getEmployeeAttendance(ntAccount, dateStr);
              
              if (response.error) {
                console.warn(`Failed to fetch attendance for ${member.name}:`, response.error.message);
                return { employee: member, attendance: null };
              }

              const attendances = Array.isArray(response.data?.items) 
                ? response.data.items 
                : [];

              const dayAttendance = attendances.length > 0 ? attendances[0] : null;

              return {
                employee: member,
                attendance: dayAttendance || null,
              };
            } catch (err) {
              console.error(`Error fetching attendance for ${member.name}:`, err);
              return { employee: member, attendance: null };
            }
          });

        const results = await Promise.all(attendancePromises);
        setAttendanceData(results);
      } catch (err) {
        console.error('Error fetching attendance:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch attendance data');
      } finally {
        setLoading(false);
      }
    };

      fetchAttendance();
    }, [members, selectedDate]);

  const formatTime = (timeString: string | null | undefined): string => {
    if (!timeString) return '-';
    try {
      return new Date(timeString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return timeString;
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const getStatusBadgeClass = (status: string | null | undefined): string => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    const statusLower = status.toLowerCase();
    if (statusLower === 'clocked_in' || statusLower === 'approved') {
      return 'bg-orange-100 text-orange-800';
    }
    if (statusLower === 'clocked_out' || statusLower === 'absent') {
      return 'bg-purple-100 text-purple-800';
    }
    if (statusLower === 'pending') {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-orange-100 text-orange-800';
  };

  const isToday = () => {
    const today = new Date();
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  };

  // Get coordinates for Indonesian cities
  const getCityCoordinates = (location: string): [number, number] => {
    const cityMap: { [key: string]: [number, number] } = {
      // [latitude, longitude]
      'jakarta': [-6.2088, 106.8456],
      'bandung': [-6.9175, 107.6191],
      'surabaya': [-7.2575, 112.7521],
      'medan': [3.5952, 98.6722],
      'semarang': [-6.9667, 110.4167],
      'makassar': [-5.1477, 119.4327],
      'palembang': [-2.9761, 104.7754],
      'yogyakarta': [-7.7956, 110.3695],
      'bali': [-8.3405, 115.0920],
      'denpasar': [-8.6705, 115.2126],
      'manado': [1.4748, 124.8421],
      'pontianak': [-0.0263, 109.3425],
      'banjarmasin': [-3.3194, 114.5908],
      'balikpapan': [-1.2379, 116.8529],
      'pekanbaru': [0.5071, 101.4478],
      'padang': [-0.9471, 100.4172],
      'malang': [-7.9666, 112.6326],
      'lombok': [-8.6500, 116.3242],
      'aceh': [5.5483, 95.3238],
      'jayapura': [-2.5489, 140.7182],
    };

    const locationLower = location.toLowerCase();
    for (const city in cityMap) {
      if (locationLower.includes(city)) {
        return cityMap[city];
      }
    }
    
    return [-6.2088, 106.8456]; // Default to Jakarta
  };

  if (loading && members.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 border border-gray-200">
        <div className="text-center text-gray-600">Loading team members...</div>
      </div>
    );
  }

  if (error && members.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 border border-gray-200">
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  // Data for map component – one entry per team member (even if location/status missing)
  const mapItems = attendanceData.map((item) => ({
    name: item.employee.name || item.employee.chinese_name || "-",
    employeeId: item.employee.employee_id,
    status: item.attendance?.status || null,
    address: item.attendance?.clock_in_address || "",
    clockInTime: item.attendance?.clock_in_time || null,
    lat: item.attendance?.clock_in_latitude ?? null,
    lng: item.attendance?.clock_in_longitude ?? null,
    // Pass through projects so popup can show what they are working on
    projects: item.employee.projects || [],
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Date Navigation Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousDay}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-500" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {formatDate(selectedDate)}
              </h3>
              {!isToday() && (
                <button
                  onClick={goToToday}
                  className="text-sm text-orange-600 hover:text-orange-800 mt-1"
                >
                  Go to Today
                </button>
              )}
          </div>
        </div>

          <button
            onClick={goToNextDay}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Next day"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Nusantara Map (client-only, via dynamic import with plain Leaflet underneath) */}
      {!loading && mapItems.length > 0 && (
        <TeamAttendanceMap items={mapItems} />
      )}

      {/* Attendance Table */}
      {loading ? (
        <div className="p-8 text-center text-gray-600">Loading attendance data...</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-6 py-3">Name</TableHead>
                <TableHead className="px-6 py-3">Employee ID</TableHead>
                <TableHead className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Clock In
                  </div>
                </TableHead>
                <TableHead className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Clock Out
                  </div>
                </TableHead>
                <TableHead className="px-6 py-3">Status</TableHead>
                <TableHead className="px-6 py-3">Location</TableHead>
                <TableHead className="px-6 py-3">Lat</TableHead>
                <TableHead className="px-6 py-3">Lng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No team members found or no attendance data available for this date.
                  </TableCell>
                </TableRow>
              ) : (
                attendanceData.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-gray-50">
                    <TableCell className="px-6 py-4 font-medium">
                      {item.employee.name || item.employee.chinese_name || '-'}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-gray-600">
                      {item.employee.employee_id || '-'}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {item.attendance?.clock_in_time 
                        ? formatTime(item.attendance.clock_in_time)
                        : <span className="text-gray-400">-</span>}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {item.attendance?.clock_out_time 
                        ? formatTime(item.attendance.clock_out_time)
                        : <span className="text-gray-400">-</span>}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {item.attendance?.status ? (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(item.attendance.status)}`}>
                          {item.attendance.status}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">No record</span>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-gray-500">
                      {item.attendance?.clock_in_address || '-'}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-xs text-gray-500">
                      {item.attendance?.clock_in_latitude != null
                        ? item.attendance.clock_in_latitude.toFixed(6)
                        : '-'}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-xs text-gray-500">
                      {item.attendance?.clock_in_longitude != null
                        ? item.attendance.clock_in_longitude.toFixed(6)
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}