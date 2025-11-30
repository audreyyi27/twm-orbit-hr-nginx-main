"use client";

import { FolderKanban, Users, Calendar } from "lucide-react";
import { EmployeeProjectDto } from "@/core/employees/dto";

interface ProjectsTabProps {
  teamName: string;
  members: EmployeeProjectDto[];
}

// Local helper to style status badges
function getStatusColor(status?: string) {
  switch (status?.toLowerCase()) {
    case "active":
      return "bg-green-100 text-green-700";
    case "completed":
      return "bg-blue-100 text-blue-700";
    case "on hold":
    case "on-hold":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function ProjectsTab({ teamName, members }: ProjectsTabProps) {
  // Group projects by project_id so each project card lists its members
  const projectMap = new Map<
    string,
    {
      project_id: string;
      project_name?: string;
      project_description?: string;
      status?: string;
      contact_window?: string;
      division?: string;
      start_date?: string;
      end_date?: string;
      members: {
        uuid: string;
        name?: string;
        chinese_name?: string;
        role?: string;
        contribution?: string;
      }[];
    }
  >();

  members.forEach((member) => {
    (member.projects || []).forEach((project) => {
      if (!projectMap.has(project.project_id)) {
        projectMap.set(project.project_id, {
          project_id: project.project_id,
          project_name: project.project_name,
          project_description: project.project_description,
          status: project.status,
          contact_window: project.contact_window,
          division: project.division,
          start_date: project.start_date,
          end_date: project.end_date,
          members: [],
        });
      }

      const entry = projectMap.get(project.project_id)!;
      entry.members.push({
        uuid: member.uuid,
        name: member.name,
        chinese_name: member.chinese_name,
        role: member.role,
        contribution: project.contribution,
      });
    });
  });

  const projects = Array.from(projectMap.values());

  // Count distinct projects (not per employee)
  const totalProjects = projects.length;
  const activeProjects = projects.filter(
    (p) => p.status?.toLowerCase() === "active"
  ).length;

  return (
    <>
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Projects</p>
              <p className="text-3xl font-bold text-gray-900">{totalProjects}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Active Projects</p>
              <p className="text-3xl font-bold text-green-600">{activeProjects}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Team Members</p>
              <p className="text-3xl font-bold text-gray-900">{members.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Project-based cards with member lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.length > 0 ? (
          projects.map((project) => (
            <div
              key={project.project_id}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col gap-4"
            >
              {/* Project header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Project
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {project.project_name}
                  </h3>
                  <div className="mt-1 text-xs text-gray-500">
                    <span className="font-mono mr-2 text-gray-400">
                      {project.project_id}
                    </span>
                    {project.project_description && (
                      <span className="text-gray-600">
                        • {project.project_description}
                      </span>
                    )}
                  </div>
                </div>
                {project.status && (
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      project.status
                    )}`}
                  >
                    {project.status}
                  </span>
                )}
              </div>

              {/* Dates / meta */}
              {(project.start_date ||
                project.end_date ||
                project.division ||
                project.contact_window) && (
                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                  {project.start_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        Start:{" "}
                        {new Date(project.start_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {project.end_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        End: {new Date(project.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {project.division && (
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-gray-600">
                        Division:
                      </span>
                      <span>{project.division}</span>
                    </div>
                  )}
                  {project.contact_window && (
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-gray-600">
                        Contact Window:
                      </span>
                      <span>{project.contact_window}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Members list */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold text-gray-500 uppercase">
                    Team Members
                  </div>
                  <div className="text-xs text-gray-500">
                    {project.members.length} member
                    {project.members.length === 1 ? "" : "s"}
                  </div>
                </div>

                {project.members.length > 0 ? (
                  <div className="space-y-2">
                    {project.members.map((member) => (
                      <div
                        key={member.uuid}
                        className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                            {(member.name || member.chinese_name || "?")
                              .toString()
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {member.name || member.chinese_name || "Unknown"}
                            </div>
                            {member.role && (
                              <div className="text-xs text-gray-500">
                                {member.role}
                              </div>
                            )}
                          </div>
                        </div>
                        {member.contribution && (
                          <div className="text-xs text-gray-600 text-right max-w-xs truncate">
                            {member.contribution}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    No team members are currently assigned to this project.
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FolderKanban className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              No projects yet
            </p>
            <p className="text-sm text-gray-500 text-center max-w-md">
              This team doesn&apos;t have any projects assigned through the
              employee project tasks table.
            </p>
          </div>
        )}
      </div>
    </>
  );
}


