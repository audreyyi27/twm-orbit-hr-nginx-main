// Employee Detail Page

import { GetEmployeeService } from "@/core/employees";
import { redirect } from "next/navigation";
import Link from "next/link";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function EmployeeDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  // Fetch employee detail
  
  const result = await GetEmployeeService(id);
  
  if (result.isError || !result.data) {
    redirect("/employees");
  }
  
  const employee = result.data;

  return (
    <div>
    {/* // <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 p-6"> */}
      {/* Back button */}
      <Link href="/employees">
        <button className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm hover:bg-white rounded-full shadow-sm transition-all">
          <span>←</span>
          <span className="text-sm font-medium">Back to Employees</span>
        </button>
      </Link>

      {/* Profile Card - Apple Style */}
      <div className="max-w-5xl mx-auto">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-8 text-white">
            <h1 className="text-4xl font-bold mb-2">{employee.name || 'Employee'}</h1>
            <p className="text-xl opacity-90">{employee.chinese_name || '-'}</p>
          </div>

          {/* Profile Content */}
          <div className="p-8 space-y-8">
            {/* Basic Info Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee ID</label>
                <p className="text-lg font-medium text-gray-900">{employee.employee_id || '-'}</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                <p className="text-lg font-medium text-gray-900">{employee.email || '-'}</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</label>
                <p className="text-lg font-medium text-gray-900">{employee.phone_no || '-'}</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Team</label>
                <p className="text-lg font-medium text-gray-900">{employee.team || '-'}</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</label>
                <p className="text-lg font-medium text-gray-900">{employee.role || '-'}</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">IT Experience (Years)</label>
                <p className="text-lg font-medium text-gray-900">{employee.it_field_work_experience || '-'}</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Start Date</label>
                <p className="text-lg font-medium text-gray-900">{employee.start_date || '-'}</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">End Date</label>
                <p className="text-lg font-medium text-gray-900">{employee.end_date || '-'}</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">iOS/Android</label>
                <p className="text-lg font-medium text-gray-900">{employee.ios_android || '-'}</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">NT Account</label>
                <p className="text-lg font-medium text-gray-900">{employee.nt_account || '-'}</p>
              </div>
            </div>

            {/* Specialization - Top Priority */}
            <div className="p-6 bg-gradient-to-r from-orange-100 to-purple-100 rounded-2xl">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2 block">Specialization</label>
              <p className="text-base font-medium text-gray-900">{employee.specialization || '-'}</p>
            </div>

            {/* Programming Skills Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-orange-500 pb-2">Technical Skills</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 rounded-xl">
                  <label className="text-sm font-bold text-orange-700 mb-2 block">Programming Languages</label>
                  <p className="text-base text-gray-900">{employee.programming_languages || '-'}</p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-xl">
                  <label className="text-sm font-bold text-purple-700 mb-2 block">Frameworks / Libraries</label>
                  <p className="text-base text-gray-900">{employee.frameworks_libraries || '-'}</p>
                </div>
                
                <div className="p-4 bg-pink-50 rounded-xl">
                  <label className="text-sm font-bold text-pink-700 mb-2 block">Tools / Platforms</label>
                  <p className="text-base text-gray-900">{employee.tools_platforms || '-'}</p>
                </div>
                
                <div className="p-4 bg-indigo-50 rounded-xl">
                  <label className="text-sm font-bold text-indigo-700 mb-2 block">Databases</label>
                  <p className="text-base text-gray-900">{employee.databases || '-'}</p>
                </div>
              </div>
            </div>

            {/* Current Projects */}
            <div className="p-6 bg-gradient-to-br from-orange-50 to-purple-50 rounded-2xl">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2 block">Current Projects</label>
              <p className="text-base font-medium text-gray-900 whitespace-pre-wrap">{employee.current_projects || '-'}</p>
            </div>

            {/* Job Description */}
            <div className="p-6 bg-gray-50 rounded-2xl">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2 block">Job Description</label>
              <p className="text-base text-gray-900 whitespace-pre-wrap">{employee.job_desc || '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

