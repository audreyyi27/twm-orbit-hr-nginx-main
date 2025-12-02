"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import MembersTab from "./components/members-tab";
import ProjectsTab from "./components/projects-tab";
import AttendanceTab from "./components/attendance-tab";
import type { EmployeeProjectDto } from "@/core/employees/dto";

type TabId = "projects" | "employees" | "attendance";

interface TeamTabsProps {
  teamName: string;
  members: EmployeeProjectDto[];
}

export default function TeamTabs({ teamName, members }: TeamTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("projects");

  const tabs: { id: TabId; label: string; disabled?: boolean }[] = [
    { id: "projects", label: "Projects" },
    { id: "employees", label: "Employees" },
    { id: "attendance", label: "Attendance" },
  ];

  // Count distinct active projects from all team members
  const activeProjectsSet = new Set<string>();
  members.forEach((member) => {
    (member.projects || []).forEach((project) => {
      if (project.status?.toLowerCase() === "active" && project.project_id) {
        activeProjectsSet.add(project.project_id);
      }
    });
  });
  const activeProjectsCount = activeProjectsSet.size;

  return (
    <div >
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-start gap-6">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/teams")}
            className="flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Teams
          </Button>
          
          {/* Team Info - Left aligned */}
          <div>
            <h5 className="text-xs text-gray-500 mb-1">Information for </h5>
            <h1 className="text-3xl font-bold text-gray-900">
              {teamName}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Projects and members information for this team.
            </p>
            <div className="mt-2">
              <span className="text-sm font-medium text-gray-700">
                Active Projects:{" "}
              </span>
              <span className="text-sm font-bold text-green-600">
                {activeProjectsCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + content */}
      <div className="p-6 space-y-6">
        {/* Tab header */}
        <div className="flex gap-2 border-b border-gray-200 -mb-[1px]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isDisabled = tab.disabled;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => !isDisabled && setActiveTab(tab.id)}
              disabled={isDisabled}
              className={[
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                isActive
                  ? "border-orange-500 text-gray-900"
                  : isDisabled
                  ? "border-transparent text-gray-400 cursor-not-allowed"
                  : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300",
              ].join(" ")}
            >
              {tab.label}
              {isDisabled && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                  Soon
                </span>
              )}
            </button>
          );
        })}
        </div>

        {/* Tab content */}
        <div className="pt-4">
          {activeTab === "projects" && (
            <ProjectsTab teamName={teamName} members={members} />
          )}
          {activeTab === "employees" && (
            <MembersTab teamName={teamName} members={members} />
          )}
          {activeTab === "attendance" && (
            <AttendanceTab teamName={teamName} />
          )}
        </div>
      </div>
    </div>
  );
}


