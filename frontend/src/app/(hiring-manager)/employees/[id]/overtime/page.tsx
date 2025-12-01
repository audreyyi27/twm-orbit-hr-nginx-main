'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getEmployeeOvertime } from '@/core/employees/attendance_api';
import type { AttendanceOvertimeDto } from '@/core/employees/dto';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function EmployeeOvertimePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const employeeId = params.id as string;
  const ntAccount = searchParams.get('nt_account') || '';

  const [overtimes, setOvertimes] = useState<AttendanceOvertimeDto[]>([]);
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
        
        const response = await getEmployeeOvertime(ntAccount);
        
        if (response.error) {
          throw new Error(response.error.message || 'Failed to fetch overtime data');
        }
        
        setOvertimes(Array.isArray(response.data?.items) ? response.data.items : []);
      } catch (err) {
        console.error('Error fetching overtime data:', err);
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
          <div className="text-center text-gray-600">Loading overtime data...</div>
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
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Overtime Records</h1>
          </div>
          <Link 
            href={`/employees/${employeeId}`}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* Overtime Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {overtimes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No overtime records found.
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
              {overtimes.map((ot, idx) => (
                <TableRow key={idx} className="hover:bg-gray-50">
                  <TableCell className="px-6 py-4 font-medium">{ot.type || '-'}</TableCell>
                  <TableCell className="px-6 py-4">
                    {formatDate(ot.start_date)}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {formatDate(ot.end_date)}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm">
                    {ot.start_time ? new Date(ot.start_time).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    }) : '-'}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm">
                    {ot.end_time ? new Date(ot.end_time).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    }) : '-'}
                  </TableCell>
                  <TableCell className="px-6 py-4">{ot.duration || '-'}</TableCell>
                  <TableCell className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(ot.status)}`}>
                      {ot.status || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-600">{ot.reason || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

