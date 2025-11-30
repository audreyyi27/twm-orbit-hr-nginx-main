import { redirect } from "next/navigation";
import { GetTeamProjectService } from "@/core/employees";
import TeamTabs from "./TeamTabs";

interface PageProps {
  params: Promise<{ team: string }>;
}

// Match project detail page behavior (dynamic, no caching)
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function TeamProjectsPage({ params }: PageProps) {
  const { team } = await params;
  const teamName = decodeURIComponent(team);

  // Fetch team + members + their projects
  const { data, isError, statusCode, message } = await GetTeamProjectService(teamName);

  // Auth handling (same pattern as other pages)
  if (statusCode === 401 || statusCode === 403) {
    redirect("/api/auth/clear-cookies");
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Error loading team projects
          </h2>
          <p className="text-red-600 mb-2">Team: {teamName}</p>
          <p className="text-red-600 mb-2">Status: {statusCode || "Unknown"}</p>
          {message && (
            <p className="text-sm text-red-700 mb-2">
              Message: {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  // `data` is TeamProjectsDto: { team_name, members: EmployeeProjectDto[] }
  return <TeamTabs teamName={data.team_name} members={data.members} />;
}



