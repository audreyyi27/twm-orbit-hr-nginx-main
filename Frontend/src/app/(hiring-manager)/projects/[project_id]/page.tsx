import { redirect, notFound } from "next/navigation";
import { GetProjectDetailsService } from "@/core/projects";
import ProjectDetailsClient from "./projectDetails";

interface ProjectDetailsPageProps {
  params: {
    project_id: string;
  };
}

export default async function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  const { project_id } = params;

  // --- Section: fetch project details
  const {
    data,
    isError,
    statusCode,
    message,
  } = await GetProjectDetailsService(project_id);

  console.log('🔍 Project Details Response:', JSON.stringify({ data, isError, statusCode, message }, null, 2));

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

  return <ProjectDetailsClient projectId={project_id} data={data} />;
}