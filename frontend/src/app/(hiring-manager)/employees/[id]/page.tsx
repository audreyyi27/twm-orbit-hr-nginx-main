// Employee Detail Page - Professional Design with Inline Edit

"use client";

import { GetEmployeeService } from "@/core/employees";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EmployeeAttendanceSection } from "./employee_attendance";
import { useState, useEffect } from "react";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EmployeeDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [employee, setEmployee] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [id, setId] = useState<string>("");

  useEffect(() => {
    const fetchEmployee = async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
      
      const result = await GetEmployeeService(resolvedParams.id);
      
      if (result.isError || !result.data) {
        // If token is invalid/expired, send user to login/clear-cookies flow
        if (result.statusCode === 401 || result.statusCode === 403) {
          router.push("/api/auth/clear-cookies");
        } else {
          // For other errors, go back to employees list
          router.push("/employees");
        }
        return;
      }
      
      setEmployee(result.data);
      setFormData(result.data);
    };

    fetchEmployee();
  }, [params, router]);

  if (!employee) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-600">Loading...</div></div>;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // TODO: Implement save functionality with API call
    console.log('Saving:', formData);
    setEmployee(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(employee);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Bar - Full Width */}
      <div className="bg-white border-b border-gray-200 px-6 lg:px-12 py-4">
        <Link 
          href="/employees" 
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <span>←</span>
          <span>Back to Employees</span>
        </Link>
      </div>

      {/* Full Width Container */}
      <div className="w-full px-6 lg:px-12 py-6 lg:py-8">
        {/* Employee Profile Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 lg:mb-8">
          <div className="p-6 lg:p-8">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  {(isEditing ? formData.team : employee.team) && (
                    <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                      {isEditing ? formData.team : employee.team}
                    </span>
                  )}
                  {!isEditing && (
                    <span className="flex items-center gap-1.5 text-sm text-green-600">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Active
                    </span>
                  )}
                </div>
                
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleInputChange}
                    className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2 border-b-2 border-blue-500 focus:outline-none bg-transparent w-full max-w-md"
                    placeholder="Employee Name"
                  />
                ) : (
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    {employee.name || 'Employee'}
                  </h1>
                )}
                
                {(employee.chinese_name || isEditing) && (
                  isEditing ? (
                    <input
                      type="text"
                      name="chinese_name"
                      value={formData.chinese_name || ''}
                      onChange={handleInputChange}
                      className="text-base lg:text-lg text-gray-600 mb-4 border-b border-gray-300 focus:outline-none bg-transparent max-w-md"
                      placeholder="Chinese Name"
                    />
                  ) : employee.chinese_name ? (
                    <p className="text-base lg:text-lg text-gray-600 mb-4">{employee.chinese_name}</p>
                  ) : null
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancel}
                      className="px-3 lg:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-3 lg:px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 lg:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit Project
                  </button>
                )}
              </div>
            </div>

            {/* Two Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {/* Project ID */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Project ID</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="employee_id"
                    value={formData.employee_id || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="ORBIT000007"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-900">
                    {employee.employee_id || '-'}
                  </div>
                )}
              </div>

              {/* Project Description (spans 2 rows on left, matches right column) */}
              <div className="lg:row-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-2">Project Description</label>
                {isEditing ? (
                  <textarea
                    name="specialization"
                    value={formData.specialization || ''}
                    onChange={handleInputChange}
                    className="w-full h-[calc(100%-28px)] min-h-[120px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                    placeholder="Dummy data for testing"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-900 h-[calc(100%-28px)] min-h-[120px]">
                    {employee.specialization || '-'}
                  </div>
                )}
              </div>

              {/* Division */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Division</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="team"
                    value={formData.team || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="EST"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-900">
                    {employee.team || '-'}
                  </div>
                )}
              </div>

              {/* Contact Window */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Contact Window</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="role"
                    value={formData.role || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="Contact Person"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-900">
                    {employee.role || '-'}
                  </div>
                )}
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Start Date</label>
                {isEditing ? (
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-900">
                    {employee.start_date || '-'}
                  </div>
                )}
              </div>

              {/* End Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">End Date</label>
                {isEditing ? (
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-900">
                    {employee.end_date || '-'}
                  </div>
                )}
              </div>

              {/* Team Members Count */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Team Members Count</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="it_field_work_experience"
                    value={formData.it_field_work_experience || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="2"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-900">
                    {employee.it_field_work_experience || '-'}
                  </div>
                )}
              </div>
            </div>

            {/* Additional info below grid - only show when not editing */}
            {!isEditing && (
              <>
                {/* Contact Info */}
                {(employee.email || employee.phone_no || employee.nt_account) && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex flex-wrap gap-4">
                      {employee.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="text-gray-600">{employee.email}</span>
                        </div>
                      )}
                      {employee.phone_no && (
                        <div className="flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="text-gray-600">{employee.phone_no}</span>
                        </div>
                      )}
                      {employee.nt_account && (
                        <div className="flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-gray-600">{employee.nt_account}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Technical Skills */}
                {(employee.programming_languages || employee.frameworks_libraries || 
                  employee.tools_platforms || employee.databases) && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Technical Skills</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {employee.programming_languages && (
                        <div>
                          <span className="text-xs text-gray-500">Languages</span>
                          <p className="text-sm text-gray-900 mt-1">{employee.programming_languages}</p>
                        </div>
                      )}
                      {employee.frameworks_libraries && (
                        <div>
                          <span className="text-xs text-gray-500">Frameworks</span>
                          <p className="text-sm text-gray-900 mt-1">{employee.frameworks_libraries}</p>
                        </div>
                      )}
                      {employee.tools_platforms && (
                        <div>
                          <span className="text-xs text-gray-500">Tools</span>
                          <p className="text-sm text-gray-900 mt-1">{employee.tools_platforms}</p>
                        </div>
                      )}
                      {employee.databases && (
                        <div>
                          <span className="text-xs text-gray-500">Databases</span>
                          <p className="text-sm text-gray-900 mt-1">{employee.databases}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Job Description */}
                {employee.job_desc && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Job Description</h3>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{employee.job_desc}</p>
                  </div>
                )}

                {/* Current Projects */}
                {employee.current_projects && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Current Projects</h3>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{employee.current_projects}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Attendance Section */}
        {employee.nt_account && (
          <EmployeeAttendanceSection 
            ntAccount={employee.nt_account} 
            employeeName={employee.name || 'Employee'} 
            employeeId={id}
          />
        )}
      </div>
    </div>
  );
}