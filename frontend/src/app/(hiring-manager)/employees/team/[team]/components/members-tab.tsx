"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreVertical, ChevronDown } from "lucide-react";
import { EmployeeProjectDto } from "@/core/employees/dto";

type ProjectType = {
  project_id: string;
  project_name: string;
  project_description?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  contribution?: string;
  task_id: string;
};

interface MembersTabProps {
  teamName: string;
  members: EmployeeProjectDto[];
}

export default function MembersTab({ teamName, members }: MembersTabProps) {
  const [showingCount] = useState(10);

  // Get unique projects from all members
  const allProjects = members
    .flatMap(member => member.projects || [])
    .reduce((acc, project) => {
      if (!acc.find((p: ProjectType) => p.project_id === project.project_id)) {
        acc.push(project);
      }
      return acc;
    }, [] as ProjectType[]);

  return (
    <>
      {/* Team Overview Card */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Section - Team Overview */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Team Overview</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-500 w-32">Team Name:</span>
                <span className="text-sm text-gray-900 font-medium">{teamName}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-500 w-32">Total Members:</span>
                <span className="text-sm text-gray-900 font-medium">{members.length}</span>
              </div>
              <div className="flex items-start">
                <span className="text-sm font-medium text-gray-500 w-32">Members:</span>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2">
                    {members.map((member) => (
                      <span
                        key={member.uuid}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                      >
                        {member.name || member.chinese_name || "Unknown"}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Projects Summary */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Active Projects ({allProjects.length})
            </h3>
            <div className="space-y-2">
              {allProjects.length > 0 ? (
                <ol className="space-y-1.5">
                  {allProjects.map((project: ProjectType, idx: number) => (
                    <li key={project.project_id} className="flex items-start">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold mr-2 flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {project.project_name}
                        </div>
                        {project.project_description && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {project.project_description}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-gray-400">No active projects</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Showing</span>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
            {showingCount}
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="text-sm text-gray-500">
          {members.length} member{members.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Name
                  </span>
                </th>
                <th className="px-6 py-4 text-left">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Employee ID
                  </span>
                </th>
                <th className="px-6 py-4 text-left">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Email
                  </span>
                </th>
                <th className="px-6 py-4 text-left">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Role
                  </span>
                </th>
                <th className="px-6 py-4 text-left">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Current Projects
                  </span>
                </th>
                <th className="px-6 py-4 text-left">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Action
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {members.length > 0 ? (
                members.slice(0, showingCount).map((member) => (
                  <tr
                    key={member.uuid}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                          {(member.name || member.chinese_name)?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {member.name || "Unknown"}
                          </div>
                          {member.chinese_name && (
                            <div className="text-xs text-gray-500">{member.chinese_name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-500 font-mono text-sm">
                        #{member.employee_id || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-700 text-sm">{member.email || "-"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {member.role || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {member.projects && member.projects.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {member.projects.slice(0, 2).map((project: ProjectType, i: number) => (
                            <span
                              key={i}
                              className="inline-flex px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg"
                            >
                              {project.project_name}
                            </span>
                          ))}
                          {member.projects.length > 2 && (
                            <span className="inline-flex px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg">
                              +{member.projects.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No projects</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/employees/${member.uuid}`}>
                          <button className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            View Details
                          </button>
                        </Link>

                        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-900">No members found</p>
                      <p className="text-xs text-gray-500 mt-1">
                        This team doesn&apos;t have any members yet.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {members.length > showingCount && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white rounded-lg transition-colors">
            Previous
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg">
            1
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white rounded-lg transition-colors">
            2
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white rounded-lg transition-colors">
            Next
          </button>
        </div>
      )}
    </>
  );
}


