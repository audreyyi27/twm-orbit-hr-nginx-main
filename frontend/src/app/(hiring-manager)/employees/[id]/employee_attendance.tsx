'use client';

import { useEffect, useState } from 'react';
import { getEmployeeAttendance, getEmployeeLeave, getEmployeeOvertime } from '@/core/employees/attendance_api';
import type { AttendanceDto, AttendanceLeaveDto, AttendanceOvertimeDto } from '@/core/employees/dto';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface EmployeeAttendanceSectionProps {
  ntAccount: string;
}

type TabType = 'attendance' | 'leave' | 'overtime';

export function EmployeeAttendanceSection({ 
  ntAccount 
}: EmployeeAttendanceSectionProps) {
  const [attendances, setAttendances] = useState<AttendanceDto[]>([]);
  const [leaves, setLeaves] = useState<AttendanceLeaveDto[]>([]);
  const [overtimes, setOvertimes] = useState<AttendanceOvertimeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('attendance');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [attendanceRes, leaveRes, overtimeRes] = await Promise.all([
          getEmployeeAttendance(ntAccount),
          getEmployeeLeave(ntAccount),
          getEmployeeOvertime(ntAccount),
        ]);
        
        if (attendanceRes.error) {
          throw new Error(attendanceRes.error.message || 'Failed to fetch attendance data');
        }
        if (leaveRes.error) {
          throw new Error(leaveRes.error.message || 'Failed to fetch leave data');
        }
        if (overtimeRes.error) {
          throw new Error(overtimeRes.error.message || 'Failed to fetch overtime data');
        }
        
        setAttendances(Array.isArray(attendanceRes.data?.items) ? attendanceRes.data.items : []);
        setLeaves(Array.isArray(leaveRes.data?.items) ? leaveRes.data.items : []);
        setOvertimes(Array.isArray(overtimeRes.data?.items) ? overtimeRes.data.items : []);
      } catch (err) {
        console.error('Error fetching attendance data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ntAccount]);

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

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadgeClass = (status: string | null | undefined): string => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    const statusLower = status.toLowerCase();
    if (statusLower === 'present' || statusLower === 'approved') {
      return 'bg-green-100 text-green-800';
    }
    if (statusLower === 'rejected' || statusLower === 'absent') {
      return 'bg-red-100 text-red-800';
    }
    if (statusLower === 'pending') {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center text-gray-600 text-sm">Loading attendance data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="flex gap-4 border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'attendance'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Attendance ({attendances.length})
          </button>
          <button
            onClick={() => setActiveTab('leave')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'leave'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Leave ({leaves.length})
          </button>
          <button
            onClick={() => setActiveTab('overtime')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'overtime'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overtime ({overtimes.length})
          </button>
        </div>
      </div>

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {attendances.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No attendance records found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6 py-3">Date</TableHead>
                  <TableHead className="px-6 py-3">Clock In</TableHead>
                  <TableHead className="px-6 py-3">Clock Out</TableHead>
                  <TableHead className="px-6 py-3">Status</TableHead>
                  <TableHead className="px-6 py-3">Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendances.map((att) => (
                  <TableRow key={att.id} className="hover:bg-gray-50">
                    <TableCell className="px-6 py-4">
                      {formatDate(att.attendance_date)}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {formatTime(att.clock_in_time)}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {formatTime(att.clock_out_time)}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(att.status)}`}>
                        {att.status || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-gray-500">
                      {att.clock_in_address || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Leave Tab */}
      {activeTab === 'leave' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {leaves.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No leave records found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6 py-3">Type</TableHead>
                  <TableHead className="px-6 py-3">Start Date</TableHead>
                  <TableHead className="px-6 py-3">End Date</TableHead>
                  <TableHead className="px-6 py-3">Duration</TableHead>
                  <TableHead className="px-6 py-3">Status</TableHead>
                  <TableHead className="px-6 py-3">Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.map((leave, idx) => (
                  <TableRow key={idx} className="hover:bg-gray-50">
                    <TableCell className="px-6 py-4">{leave.type || '-'}</TableCell>
                    <TableCell className="px-6 py-4">
                      {formatDate(leave.start_date)}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {formatDate(leave.end_date)}
                    </TableCell>
                    <TableCell className="px-6 py-4">{leave.duration || '-'}</TableCell>
                    <TableCell className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(leave.status)}`}>
                        {leave.status || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm">{leave.reason || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Overtime Tab */}
      {activeTab === 'overtime' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {overtimes.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No overtime records found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6 py-3">Type</TableHead>
                  <TableHead className="px-6 py-3">Start</TableHead>
                  <TableHead className="px-6 py-3">End</TableHead>
                  <TableHead className="px-6 py-3">Duration</TableHead>
                  <TableHead className="px-6 py-3">Status</TableHead>
                  <TableHead className="px-6 py-3">Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overtimes.map((ot, idx) => (
                  <TableRow key={idx} className="hover:bg-gray-50">
                    <TableCell className="px-6 py-4">{ot.type || '-'}</TableCell>
                    <TableCell className="px-6 py-4">
                      {formatDate(ot.start_date)}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {formatDate(ot.end_date)}
                    </TableCell>
                    <TableCell className="px-6 py-4">{ot.duration || '-'}</TableCell>
                    <TableCell className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(ot.status)}`}>
                        {ot.status || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm">{ot.reason || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}

