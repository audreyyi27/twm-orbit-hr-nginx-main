// Main employe Page

import { GetEmployeesService } from "@/core/employees";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchFilter } from "./search-filter";

interface PageProps {
  searchParams: {
    page?: string;
    per_page?: string;
    search?: string;
  };
}

export default async function EmployeesPage({ searchParams }: PageProps) {
  const { page, per_page, search } = await searchParams;
  
  // Fetch employees for list view
  const { data, meta, isError, statusCode } = await GetEmployeesService({
    page: (page as string) || "1",
    perPage: (per_page as string) || "10",
    search: (search as string) || "",
  });

  // Fetch all employees for statistics (total and active count)
  const { data: allEmployees } = await GetEmployeesService({
    page: "1",
    perPage: "1000", // Large number to get all employees
    search: undefined,
  });

  // Calculate statistics
  const totalEmployees = allEmployees?.length || 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const activeEmployees = allEmployees?.filter(emp => {
    if (!emp.end_date) return true; // No end date means active
    const endDate = new Date(emp.end_date);
    endDate.setHours(0, 0, 0, 0);
    return endDate >= today; // End date is today or in the future
  }).length || 0;

  // Calculate starting number for current page
  // Example: Page 1 = 0, Page 2 = 10, Page 3 = 20 (if per_page = 10)
  const currentPage = parseInt((page as string) || "1");
  const perPageNum = parseInt((per_page as string) || "10");
  const startNumber = (currentPage - 1) * perPageNum;

  const totalPages = meta?.total_pages || 1; 

  // Exceed pages handling (redirect to page 1) 
  if (currentPage > totalPages && totalPages > 0) {
    const params = new URLSearchParams();  // 
    params.set("page", "1");
    if (per_page) params.set("per_page", per_page as string);
    if (search) params.set("search", search as string);
    redirect(`/employees?${params.toString()}`);  
  }

  // Handle auth errors
  if (statusCode === 401 || statusCode === 403) {
    redirect('/api/auth/clear-cookies');
  }

  // Handle errors
  if (isError) {
    return <div className="p-4">Error loading employees</div>;
  }

  return (
    <div >
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Taiwan Mobile Indonesian Employees</h1>
            
          </div>
        </div>

        

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900">{totalEmployees}</p>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Active Employees</p>
                <p className="text-3xl font-bold text-gray-900">{activeEmployees}</p>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar - Full Width */}
      <div className="bg-white px-5 py-4">
        <SearchFilter />
      </div>

      {/* Content */}
      <div>

        {/* Default list view */}
        <div className="bg-white border rounded-lg overflow-hidden text-base">
          <table className="w-full">
            <thead >
              <tr>
                <th className="px-6 py-4 text-left w-20 text-base font-semibold text-gray-700">No</th>
                <th className="px-6 py-4 text-left text-base font-semibold text-gray-700">Name</th>
                <th className="px-6 py-4 text-left text-base font-semibold text-gray-700">Employee ID</th>
                <th className="px-6 py-4 text-left text-base font-semibold text-gray-700">Email</th>
                <th className="px-6 py-4 text-left text-base font-semibold text-gray-700">Team</th>
                <th className="px-6 py-4 text-left text-base font-semibold text-gray-700">Role</th>
                <th className="px-6 py-4 text-left text-base font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {data && data.length > 0 ? (
                data.map((employee, index) => (
                  <tr key={employee.uuid} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-500 text-base">{startNumber + index + 1}</td>
                    <td className="px-6 py-4 text-base font-medium text-gray-900">{employee.name || '-'}</td>
                    <td className="px-6 py-4 text-base">{employee.employee_id || '-'}</td>
                    <td className="px-6 py-4 text-base">{employee.email || '-'}</td>
                    <td className="px-6 py-4 text-base">{employee.team || '-'}</td>
                    <td className="px-6 py-4 text-base">{employee.role || '-'}</td>
                    <td className="px-6 py-4">
                      <Link href={`/employees/${employee.uuid}`}>
                        <Button size="default" variant="outline">See</Button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 text-base">
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.total_pages > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Page {meta.page} of {meta.total_pages}
            </div>
            
            <div className="flex gap-2">
              {/* Previous */}
              {meta.page > 1 ? (
                <Link href={`/employees?page=${meta.page - 1}&per_page=${meta.per_page}${search ? `&search=${search}` : ''}`}>
                  <Button variant="outline" size="sm">Previous</Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" disabled>Previous</Button>
              )}
              
              {/* Next */}
              {meta.page < meta.total_pages ? (
                <Link href={`/employees?page=${meta.page + 1}&per_page=${meta.per_page}${search ? `&search=${search}` : ''}`}>
                  <Button variant="outline" size="sm">Next</Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" disabled>Next</Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}