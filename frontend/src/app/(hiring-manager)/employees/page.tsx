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
  
  // Fetch employees
  const { data, meta, isError, statusCode } = await GetEmployeesService({
    page: (page as string) || "1",
    perPage: (per_page as string) || "10",
    search: search as string || "",
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
      <div className="flex justify-between items-center mb-4">
      <h1 className="text-2xl font-bold mb-4">Employees</h1>
      <SearchFilter />
      </div>


      {/* Simple table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left w-16">No</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Employee ID</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Team</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((employee, index) => (
                <tr key={employee.uuid} className="border-t hover:bg-gray-50">

                  {/* Shown and direct to starNum + 1  */}
                  <td className="px-4 py-3 text-gray-500">{startNumber + index + 1}</td>
                  
                  <td className="px-4 py-3">{employee.name || '-'}</td>
                  <td className="px-4 py-3">{employee.employee_id || '-'}</td>
                  <td className="px-4 py-3">{employee.email || '-'}</td>
                  <td className="px-4 py-3">{employee.team || '-'}</td>
                  <td className="px-4 py-3">{employee.role || '-'}</td>
                  <td className="px-4 py-3">
                    <Link href={`/employees/${employee.uuid}`}>
                      <Button size="sm" variant="outline">See</Button>
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
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
  );
}