'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getEmployeeLeave } from '@/core/employees/attendance_api';
import type { AttendanceLeaveDto } from '@/core/employees/dto';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function EmployeeLeavePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const employeeId = params.id as string;
  const ntAccount = searchParams.get('nt_account') || '';

  const [leaves, setLeaves] = useState<AttendanceLeaveDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ntAccount) {
      setError('NT Account is required');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await getEmployeeLeave(ntAccount);
        
        if (response.error) {
          throw new Error(response.error.message || 'Failed to fetch leave data');
        }
        
        setLeaves(Array.isArray(response.data?.items) ? response.data.items : []);
      } catch (err) {
        console.error('Error fetching leave data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ntAccount]);

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
    if (statusLower === 'approved') {
      return 'bg-green-100 text-green-800';
    }
    if (statusLower === 'rejected') {
      return 'bg-red-100 text-red-800';
    }
    if (statusLower === 'pending') {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center text-gray-600">Loading leave data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Link 
              href={`/employees/${employeeId}`}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← Back to Employee Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Leave Records</h1>
          </div>
          <Link 
            href={`/employees/${employeeId}`}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* Leave Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {leaves.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No leave records found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-6 py-3">Type</TableHead>
                <TableHead className="px-6 py-3">Start Date</TableHead>
                <TableHead className="px-6 py-3">End Date</TableHead>
                <TableHead className="px-6 py-3">Start Time</TableHead>
                <TableHead className="px-6 py-3">End Time</TableHead>
                <TableHead className="px-6 py-3">Duration</TableHead>
                <TableHead className="px-6 py-3">Status</TableHead>
                <TableHead className="px-6 py-3">Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.map((leave, idx) => (
                <TableRow key={idx} className="hover:bg-gray-50">
                  <TableCell className="px-6 py-4 font-medium">{leave.type || '-'}</TableCell>
                  <TableCell className="px-6 py-4">
                    {formatDate(leave.start_date)}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {formatDate(leave.end_date)}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm">
                    {leave.start_time ? new Date(leave.start_time).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    }) : '-'}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm">
                    {leave.end_time ? new Date(leave.end_time).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    }) : '-'}
                  </TableCell>
                  <TableCell className="px-6 py-4">{leave.duration || '-'}</TableCell>
                  <TableCell className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(leave.status)}`}>
                      {leave.status || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-600">{leave.reason || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

