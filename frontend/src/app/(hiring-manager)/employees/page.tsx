// Simple Employees Page

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
    <div className="p-6">

      {/* Search Filter */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Employees</h1>
          <p className="text-sm text-gray-500 mt-1">Manage employee information</p>
        </div>
        <div className="flex items-center gap-3">
          <SearchFilter />
        </div>
      </div>

      {/* Default list view */}
      <div className="border rounded-lg overflow-hidden text-base">
          <table className="w-full">
            <thead className="bg-gray-50">
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
<<<<<<< HEAD:Frontend/src/app/(hiring-manager)/employees/page.tsx
              <Link href={`/employees?page=${meta.page - 1}&per_page=${per_page || '10'}${search ? `&search=${search}` : ''}`}>
=======
              <Link href={`/employees?page=${meta.page - 1}&per_page=${meta.per_page}${search ? `&search=${search}` : ''}`}>
>>>>>>> d72129bf2b4a1a853da9e59a0b8d4104b9050b5a:frontend/src/app/(hiring-manager)/employees/page.tsx
                <Button variant="outline" size="sm">Previous</Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>Previous</Button>
            )}
            
            {/* Next */}
            {meta.page < meta.total_pages ? (
<<<<<<< HEAD:Frontend/src/app/(hiring-manager)/employees/page.tsx
              <Link href={`/employees?page=${meta.page + 1}&per_page=${per_page || '10'}${search ? `&search=${search}` : ''}`}>
=======
              <Link href={`/employees?page=${meta.page + 1}&per_page=${meta.per_page}${search ? `&search=${search}` : ''}`}>
>>>>>>> d72129bf2b4a1a853da9e59a0b8d4104b9050b5a:frontend/src/app/(hiring-manager)/employees/page.tsx
                <Button variant="outline" size="sm">Next</Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>Next</Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}