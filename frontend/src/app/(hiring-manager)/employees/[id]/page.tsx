// Employee Detail Page - Minimal Design

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
  
  const result = await GetEmployeeService(id);
  
  if (result.isError || !result.data) {
    redirect("/employees");
  }
  
  const employee = result.data;

  return (
    <div className="min-h-screen p-6">
      {/* Back button */}
      <Link href="/employees" className=" items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6">
        <span>←</span>
        <span>Back to Employees</span>
      </Link>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{employee.name || 'Employee'}</h1>
          {employee.chinese_name && (
            <p className="text-gray-600 mt-1">{employee.chinese_name}</p>
          )}
          <div className="flex gap-6 mt-4 text-sm text-gray-600">
            <span>ID: {employee.employee_id || '-'}</span>
            <span>Team: {employee.team || '-'}</span>
            <span>Role: {employee.role || '-'}</span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          
          {/* Contact */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Contact</h2>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <span className="text-gray-500 w-24">Email</span>
                <span className="text-gray-900">{employee.email || '-'}</span>
              </div>
              <div className="flex gap-3">
                <span className="text-gray-500 w-24">Phone</span>
                <span className="text-gray-900">{employee.phone_no || '-'}</span>
              </div>
              <div className="flex gap-3">
                <span className="text-gray-500 w-24">NT Account</span>
                <span className="text-gray-900">{employee.nt_account || '-'}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100"></div>

          {/* Employment */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Employment</h2>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <span className="text-gray-500 w-24">Start Date</span>
                <span className="text-gray-900">{employee.start_date || '-'}</span>
              </div>
              <div className="flex gap-3">
                <span className="text-gray-500 w-24">End Date</span>
                <span className="text-gray-900">{employee.end_date || '-'}</span>
              </div>
              <div className="flex gap-3">
                <span className="text-gray-500 w-24">Experience</span>
                <span className="text-gray-900">
                  {employee.it_field_work_experience ? `${employee.it_field_work_experience} years` : '-'}
                </span>
              </div>
            </div>
          </div>

          {employee.specialization && (
            <>
              <div className="border-t border-gray-100"></div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-2">Specialization</h2>
                <p className="text-sm text-gray-700">{employee.specialization}</p>
              </div>
            </>
          )}

          {/* Technical Skills */}
          {(employee.programming_languages || employee.frameworks_libraries || 
            employee.tools_platforms || employee.databases) && (
            <>
              <div className="border-t border-gray-100"></div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Technical Skills</h2>
                <div className="space-y-2 text-sm">
                  {employee.programming_languages && (
                    <div className="flex gap-3">
                      <span className="text-gray-500 w-32">Languages</span>
                      <span className="text-gray-900">{employee.programming_languages}</span>
                    </div>
                  )}
                  {employee.frameworks_libraries && (
                    <div className="flex gap-3">
                      <span className="text-gray-500 w-32">Frameworks</span>
                      <span className="text-gray-900">{employee.frameworks_libraries}</span>
                    </div>
                  )}
                  {employee.tools_platforms && (
                    <div className="flex gap-3">
                      <span className="text-gray-500 w-32">Tools</span>
                      <span className="text-gray-900">{employee.tools_platforms}</span>
                    </div>
                  )}
                  {employee.databases && (
                    <div className="flex gap-3">
                      <span className="text-gray-500 w-32">Databases</span>
                      <span className="text-gray-900">{employee.databases}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {employee.current_projects && (
            <>
              <div className="border-t border-gray-100"></div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-2">Current Projects</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{employee.current_projects}</p>
              </div>
            </>
          )}

          {employee.job_desc && (
            <>
              <div className="border-t border-gray-100"></div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-2">Job Description</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{employee.job_desc}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}