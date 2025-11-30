import { redirect } from "next/navigation";
import ProjectsClient from "./projectsList";
import { GetProjectsDashboardService } from "@/core/projects";

// Force dynamic rendering - no static generation or caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProjectsPage() {
  // --- Section: fetch project dashboard data
  const {
    data: dashboardData,
    isError,
    statusCode,
    message,
  } = await GetProjectsDashboardService();
  

  // --- Section: redirect unauthenticated users to re-auth flow
  if (statusCode === 401 || statusCode === 403) {
    redirect('/api/auth/clear-cookies');
  }

  // --- Section: display contextual troubleshooting when backend request fails
  if (isError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error loading projects</h2>
          <p className="text-red-600 mb-4">Status: {statusCode || 'Unknown'}</p>
          {message && <p className="text-sm text-red-700 mb-4">Message: {message}</p>}
          <div className="text-sm text-gray-700">
            <p className="font-semibold mb-2">Troubleshooting:</p>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Check if backend server is running on port 8000</li>
              <li>Verify tables exist: employee_projects, employee_projects_tasks, employees</li>
              <li>Check if tables have data</li>
              <li>Verify the /projects/dashboard endpoint exists</li>
              <li>Check browser console for detailed errors</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Get projects data directly from the dashboard endpoint
  const projects = dashboardData?.projects ?? [];
  const totalProjects = dashboardData?.total_projects ?? 0;
  const activeProjects = dashboardData?.active_projects ?? 0;
  const completedProjects = dashboardData?.completed_projects ?? 0;

  return (
    <ProjectsClient
      projects={projects}
      totalProjects={totalProjects}
      activeProjects={activeProjects}
      completedProjects={completedProjects}
    />
  );
}