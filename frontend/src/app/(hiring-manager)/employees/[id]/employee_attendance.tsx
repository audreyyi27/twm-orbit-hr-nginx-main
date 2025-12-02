'use client';

import { useEffect, useState } from 'react';
import { getEmployeeAttendance, getEmployeeLeave, getEmployeeOvertime } from '@/core/employees/attendance_api';
import type { AttendanceDto, AttendanceLeaveDto, AttendanceOvertimeDto } from '@/core/employees/dto';

interface EmployeeAttendanceSectionProps {
  ntAccount: string;
  employeeName: string;
  employeeId: string;
}

type TabType = 'attendance' | 'leave' | 'overtime';

export function EmployeeAttendanceSection({ 
  ntAccount,
  employeeName,
  employeeId
}: EmployeeAttendanceSectionProps) {
  const [attendances, setAttendances] = useState<AttendanceDto[]>([]);
  const [leaves, setLeaves] = useState<AttendanceLeaveDto[]>([]);
  const [overtimes, setOvertimes] = useState<AttendanceOvertimeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('attendance');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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
        hour12: true,
      });
    } catch {
      return timeString;
    }
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      });
    } catch {
      return dateString;
    }
  };

  const formatDateShort = (dateString: string | null | undefined): string => {
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
    
    if (statusLower === 'clocked_in' || statusLower === 'approved') {
      return 'bg-orange-100 text-orange-800';
    }
    if (statusLower === 'clocked_out' || statusLower === 'absent') {
      return 'bg-purple-100 text-purple-800';
    }

    if (statusLower === 'on leave' || statusLower === 'on_leave') {
      return 'bg-pink-100 text-pink-800';
    }
    if (statusLower === 'pending') {
      return 'bg-yellow-100 text-yellow-800';
    }
    
    return 'bg-gray-100 text-gray-600';;
  };

  const calculateTotalHours = (clockIn: string | null | undefined, clockOut: string | null | undefined): string => {
    if (!clockIn || !clockOut) return '-';
    try {
      const start = new Date(clockIn);
      const end = new Date(clockOut);
      const diff = end.getTime() - start.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } catch {
      return '-';
    }
  };


  // Filter attendances by selected month
  const getFilteredAttendances = () => {
    if (!attendances.length) return [];
    
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    return attendances.filter((att) => {
      if (!att.attendance_date) return false;
      try {
        const attDate = new Date(att.attendance_date);
        return attDate.getFullYear() === year && attDate.getMonth() === month;
      } catch {
        return false;
      }
    });
  };

  // Get available months from attendance data
  const getAvailableMonths = () => {
    const months = new Set<string>();
    attendances.forEach((att) => {
      if (att.attendance_date) {
        try {
          const date = new Date(att.attendance_date);
          const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
          months.add(monthKey);
        } catch {
          // Ignore invalid dates
        }
      }
    });
    return Array.from(months).sort().reverse(); // Most recent first
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  };

  const goToCurrentMonth = () => {
    setSelectedDate(new Date());
  };

  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const filteredAttendances = getFilteredAttendances();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center text-gray-600">Loading attendance data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header with Tabs */}
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Attendance Records</h2>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-200 -mb-5">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`pb-4 px-1 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'attendance'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Attendance ({attendances.length})
          </button>
          <button
            onClick={() => setActiveTab('leave')}
            className={`pb-4 px-1 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'leave'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Leave ({leaves.length})
          </button>
          <button
            onClick={() => setActiveTab('overtime')}
            className={`pb-4 px-1 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'overtime'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Overtime ({overtimes.length})
          </button>
        </div>
      </div>

      {/* Month Navigation - Only for Attendance */}
      {activeTab === 'attendance' && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={goToPreviousMonth}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                aria-label="Previous month"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-900 min-w-[160px] text-center">
                  {formatMonthYear(selectedDate)}
                </span>
                {selectedDate.getMonth() !== new Date().getMonth() || 
                 selectedDate.getFullYear() !== new Date().getFullYear() ? (
                  <button
                    onClick={goToCurrentMonth}
                    className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                  >
                    Today
                  </button>
                ) : null}
              </div>
              <button 
                onClick={goToNextMonth}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                aria-label="Next month"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Width Content */}
      <div className="p-6">
        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Clock-In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Clock-In Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Clock-Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Clock-Out Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Work Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredAttendances.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                      {attendances.length === 0 
                        ? 'No attendance records found.'
                        : `No attendance records found for ${formatMonthYear(selectedDate)}.`}
                    </td>
                  </tr>
                ) : (
                  filteredAttendances.map((att) => (
                    <tr key={att.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDateShort(att.attendance_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-orange-600">
                          {formatTime(att.clock_in_time)}
                        </div>
                        {(att.clock_in_latitude && att.clock_in_longitude) && (
                          <div className="text-xs text-gray-500 mt-1">
                            {att.clock_in_latitude.toFixed(6)}, {att.clock_in_longitude.toFixed(6)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {att.clock_in_address || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-purple-600">
                          {formatTime(att.clock_out_time)}
                        </div>
                        {(att.clock_out_latitude && att.clock_out_longitude) && (
                          <div className="text-xs text-gray-500 mt-1">
                            {att.clock_out_latitude.toFixed(6)}, {att.clock_out_longitude.toFixed(6)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {att.clock_out_address || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 flex items-center gap-1">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {calculateTotalHours(att.clock_in_time, att.clock_out_time)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${getStatusBadgeClass(att.status)} border border-black-200`}>
                          {att.status || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs">
                          {att.work_description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs">
                          {att.plan || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs">
                          {att.reason || '-'}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Leave Tab */}
        {activeTab === 'leave' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Start Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    End Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No leave records found.
                    </td>
                  </tr>
                ) : (
                  leaves.map((leave, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{leave.type || '-'}</td>
                      <td className="px-6 py-4">
                        {formatDateShort(leave.start_date)}
                      </td>
                      <td className="px-6 py-4">
                        {formatDateShort(leave.end_date)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {leave.start_time ? new Date(leave.start_time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        }) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {leave.end_time ? new Date(leave.end_time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        }) : '-'}
                      </td>
                      <td className="px-6 py-4">{leave.duration || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(leave.status)}`}>
                          {leave.status || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{leave.reason || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Overtime Tab */}
        {activeTab === 'overtime' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Start Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    End Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {overtimes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No overtime records found.
                    </td>
                  </tr>
                ) : (
                  overtimes.map((ot, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{ot.type || '-'}</td>
                      <td className="px-6 py-4">
                        {formatDateShort(ot.start_date)}
                      </td>
                      <td className="px-6 py-4">
                        {formatDateShort(ot.end_date)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {ot.start_time ? new Date(ot.start_time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        }) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {ot.end_time ? new Date(ot.end_time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        }) : '-'}
                      </td>
                      <td className="px-6 py-4">{ot.duration || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(ot.status)}`}>
                          {ot.status || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{ot.reason || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}