import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { GetProjectDetailsService, GetProjectMembersWithAttendanceService } from "@/core/projects";
import ProjectDetailsClient from "./projectDetails";
import ProjectInfo from "./teamview";
import ProjectMapWrapper from "./project-map-wrapper";

interface ProjectDetailsPageProps {
  params: {
    project_id: string;
  };
}

// Force dynamic rendering - DISABLE ALL CACHING
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const dynamicParams = true;

/**
 * Main Project Details Page
 * 
 * This page orchestrates the project details view by:
 * 1. Fetching project data from the backend
 * 2. Handling authentication and error states
 * 3. Rendering the main client component which includes:
 *    - <ProjectDetails> - Project info component (from teamview.tsx)
 *    - Team Members section - Member cards with attendance (from projectDetails.tsx)
 */
export default async function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  const { project_id } = await params;

  // --- Section: fetch project details
  const {
    data,
    isError,
    statusCode,
    message,
  } = await GetProjectDetailsService(project_id);

  // --- Section: handle auth errors
  if (statusCode === 401 || statusCode === 403) {
    redirect('/api/auth/clear-cookies');
  }

  // --- Section: handle not found
  if (statusCode === 404) {
    notFound();
  }

  // --- Section: handle other errors
  if (isError || !data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error loading project details</h2>
          <p className="text-red-600 mb-4">Status: {statusCode || 'Unknown'}</p>
          {message && <p className="text-sm text-red-700 mb-4">Message: {message}</p>}
        </div>
      </div>
    );
  }

  // --- Section: fetch project members with attendance for today
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const attendanceResult = await GetProjectMembersWithAttendanceService(project_id, today);
  const membersWithAttendance = attendanceResult.data || [];

  const { project, team } = data;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Back Button */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Projects
      </Link>

      {/* Project Info Component */}
      <ProjectInfo project={project} team={team} projectId={project_id} />

      {/* Project Attendance Map */}
      <ProjectMapWrapper 
        items={membersWithAttendance.map(member => ({
          name: member.name || 'Unknown',
          employeeId: member.employee_id || undefined,
          status: member.attendance?.status || null,
          address: member.attendance?.clock_in_address || member.attendance?.clock_out_address || 'No address',
          clockInTime: member.attendance?.clock_in_time || null,
          lat: member.attendance?.clock_in_latitude || member.attendance?.clock_out_latitude || null,
          lng: member.attendance?.clock_in_longitude || member.attendance?.clock_out_longitude || null,
          role: member.role || undefined,
          department: member.team_name || undefined,
        }))}
      />
      
      {/* Team Members Section */}
      <ProjectDetailsClient 
        projectId={project_id} 
        data={data} 
        membersWithAttendance={membersWithAttendance}
      />
    </div>
  );
}