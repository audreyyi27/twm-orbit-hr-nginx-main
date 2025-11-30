"use client";

import { Calendar, Clock } from "lucide-react";

interface AttendanceTabProps {
  teamName: string;
}

export default function AttendanceTab({ teamName }: AttendanceTabProps) {
  return (
    <div className="bg-white rounded-xl p-16 text-center border border-gray-200">
      <div className="max-w-md mx-auto">
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Calendar className="w-10 h-10 text-orange-500" />
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Attendance Coming Soon
        </h3>
        
        <p className="text-gray-600 mb-6">
          Track team attendance, clock-in/out times, overtime, and generate attendance reports for <strong>{teamName}</strong> team.
        </p>

        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
          <div className="bg-gray-50 rounded-lg p-4">
            <Clock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-xs font-medium text-gray-600">Clock In/Out</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <Calendar className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-xs font-medium text-gray-600">Daily Records</p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> This feature is under development and will be available soon.
          </p>
        </div>
      </div>
    </div>
  );
}


