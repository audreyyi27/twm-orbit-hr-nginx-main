"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { TeamWithDetailsDto } from "@/core/projects/dto";

interface TeamCardData {
  team_name: string;
  member_count: number;
  members: Array<{ name?: string; role?: string }>;
}

export default function TeamMain() {
  const router = useRouter();
  const [teams, setTeams] = useState<TeamCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeProjectsCount, setActiveProjectsCount] = useState<number>(0);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      setActiveProjectsCount(0);
      
      // console.log("🔍 Fetching teams...");
      const response = await apiFetch("/teams/with-details");
      // console.log("📦 API Response:", response);
      
      // Check for error
      if (response && response.error) {
        console.error("❌ API Error:", response.error);
        setError(response.error.message || "Failed to load teams");
        setTeams([]);
        setActiveProjectsCount(0);
        return;
      }
      
      // Get teams data - handle direct array or wrapped response
      let teamsData = response;
      if (response && Array.isArray(response)) {
        teamsData = response;
        // console.log("✅ Response is direct array");
      } else if (response?.data && Array.isArray(response.data)) {
        teamsData = response.data;
        // console.log("✅ Response wrapped in data property");
      } else if (response?.items && Array.isArray(response.items)) {
        teamsData = response.items;
        // console.log("✅ Response wrapped in items property");
      } else {
        // console.warn("⚠️ Unexpected response format:", response);
      }
      
      // console.log("📊 Teams Data:", teamsData);
      // console.log("📊 Is Array?", Array.isArray(teamsData));
      // console.log("📊 Length:", teamsData?.length);
      
      if (!Array.isArray(teamsData)) {
        console.error("❌ Teams data is not an array:", typeof teamsData);
        setError("Invalid response format from server");
        setTeams([]);
        setActiveProjectsCount(0);
        return;
      }
      
      if (teamsData.length === 0) {
        console.warn("⚠️ No teams found in response");
        setTeams([]);
        setActiveProjectsCount(0);
        return;
      }
      
      // Simple transformation: just team name and members
      const transformedTeams: TeamCardData[] = teamsData.map((teamData: TeamWithDetailsDto) => {
        const teamName = teamData.team?.team_name || "Unknown Team";
        const members = teamData.members || [];
        console.log(`📝 Processing team: ${teamName} with ${members.length} members`);
        return {
          team_name: teamName,
          member_count: members.length,
          members: members,
        };
      });
      
      console.log("✅ Transformed teams:", transformedTeams);
      setTeams(transformedTeams);
      
      // Calculate total distinct active projects across all teams
      const activeProjectsSet = new Set<string>();
      teamsData.forEach((teamData: TeamWithDetailsDto) => {
        (teamData.projects || []).forEach((project) => {
          if (project.status?.toLowerCase() === "active" && project.project_id) {
            activeProjectsSet.add(project.project_id);
          }
        });
      });
      setActiveProjectsCount(activeProjectsSet.size);
    } catch (error) {
      console.error("❌ Error fetching teams:", error);
      setError(error instanceof Error ? error.message : "Failed to load teams");
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamClick = (teamName: string) => {
    router.push(`/teams/${encodeURIComponent(teamName)}`);
  };

  const handleEditTeam = (e: React.MouseEvent, teamName: string) => {
    e.stopPropagation(); // Prevent card click
    // TODO: Open edit modal or navigate to edit page
    console.log("Edit team:", teamName);
  };

  const handleAddTeam = () => {
    // TODO: Open add team modal
    console.log("Add team");
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-white  border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Indonesian Team Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage teams and employees</p>
          </div>
          <Button
            onClick={handleAddTeam}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Team
          </Button>
        </div>

      </div>

      {/* Content */}
      <div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Teams</p>
                <p className="text-3xl font-bold text-gray-900">{teams.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Members</p>
                <p className="text-3xl font-bold text-gray-900">
                  {teams.reduce((sum, team) => sum + (team.member_count || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Active Projects</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? "-" : activeProjectsCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Team Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-16 mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))
          ) : error ? (
            // Error state
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">Error loading teams</p>
              <p className="text-sm text-gray-500 mb-4">{error}</p>
              <Button onClick={fetchTeams} className="bg-blue-600 hover:bg-blue-700">
                Try Again
              </Button>
            </div>
          ) : teams.length > 0 ? (
            teams.map((team) => (
              <div
                key={team.team_name}
                onClick={() => handleTeamClick(team.team_name)}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all cursor-pointer group"
              >
                {/* Team Name - Bigger */}
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {team.team_name}
                </h3>

                {/* Subtitle/Role */}
                <p className="text-sm text-gray-500 mb-6">Team Lead</p>

                {/* Member Names as Small Boxes */}
                {team.members && team.members.length > 0 && (
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                      {team.members.map((member, idx) => (
                        <span
                          key={idx}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                            idx === 0
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {member.name || "Unknown"}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ))
          ) : (
            // Empty state
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">No teams yet</p>
              <p className="text-sm text-gray-500 mb-4">Get started by creating your first team</p>
              <Button onClick={handleAddTeam} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Team
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}