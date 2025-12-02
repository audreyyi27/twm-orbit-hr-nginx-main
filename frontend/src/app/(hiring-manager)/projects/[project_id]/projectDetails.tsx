'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AddMembersModal from './addMembers';
import { RemoveProjectMemberService } from '@/core/projects/service';
import type { ProjectDetailsDto, ProjectMemberDto, ProjectMemberAttendanceResponse } from '@/core/projects';

interface ProjectDetailsProps {
  projectId: string;
  data: ProjectDetailsDto;
  membersWithAttendance?: ProjectMemberAttendanceResponse[];
}

export default function ProjectDetails({ projectId, data, membersWithAttendance = [] }: ProjectDetailsProps) {
  const router = useRouter();
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [localMembers, setLocalMembers] = useState<ProjectMemberDto[]>(data.members);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const members = localMembers;
  const { project, team } = data;
  const member_count = members.length;

  // Add member handler - optimistic update
  const handleMemberAdded = (newMember?: ProjectMemberDto) => {
    if (newMember) {
      // Optimistically add to UI immediately
      setLocalMembers(prev => [...prev, newMember]);
    }
    
    // Silently refresh in background to sync with server
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Remove member handler - optimistic update
  const handleRemoveMember = async (taskId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this project?`)) {
      return;
    }

    // Close delete mode
    setIsDeleteMode(false);

    // Optimistically remove from UI immediately
    setLocalMembers(prev => prev.filter(m => m.task_id !== taskId));

    // Call API to delete member
    const result = await RemoveProjectMemberService(projectId, taskId);
    
    if (result.isError) {
      // Revert optimistic update on error
      setLocalMembers(data.members);
      
      if (result.statusCode === 401 || result.statusCode === 403) {
        alert('Your session has expired. Please log in again.');
        router.push('/api/auth/clear-cookies');
        return;
      }
      alert(`Failed to remove member: ${result.message}`);
      return;
    }
    
    // Silently refresh in background to sync with server
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };


  // Format time helper
  const formatTime = (timeString: string | null | undefined): string => {
    if (!timeString) return '-';
    try {
      return new Date(timeString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return timeString;
    }
  };

  return (
    <>
      {/* Team Members Section */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Team Members</h2>
            <p className="text-gray-600">
              {member_count} {member_count === 1 ? 'member' : 'members'} working on this project
            </p>
          </div>
          
          <div className="flex gap-3">
            {member_count > 0 && (
              <button 
                onClick={() => setIsDeleteMode(!isDeleteMode)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDeleteMode 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isDeleteMode ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove Members
                  </span>
                )}
              </button>
            )}
            
            <button 
              onClick={() => setIsAddMemberModalOpen(true)}
              className="px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:border-blue-300 hover:text-blue-600 transition-colors font-medium"
            >
              + Add Member
            </button>
          </div>
        </div>

        {/* Members List */}
        {member_count > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <div
                key={member.task_id || member.employee_uuid}
                className="bg-gradient-to-br from-gray-50 to-white rounded-lg border-2 border-gray-200 p-5 hover:border-blue-300 transition-colors relative"
              >
                {isDeleteMode && (
                  <button
                    onClick={() => handleRemoveMember(member.task_id, member.name || 'this member')}
                    className="absolute top-3 right-3 p-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors z-10"
                    title="Remove from project"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}

                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {(member.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-8">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {member.name || 'Unknown'}
                    </h3>
                    {member.chinese_name && (
                      <p className="text-sm text-gray-500 truncate">{member.chinese_name}</p>
                    )}
                    {member.employee_id && (
                      <p className="text-xs text-gray-400">Employee ID: {member.employee_id}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  {member.role && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-700">{member.role}</span>
                    </div>
                  )}
                  
                  {member.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-600 truncate">{member.email}</span>
                    </div>
                  )}

                  {member.team_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-gray-600 truncate">{member.team_name}</span>
                    </div>
                  )}

                  {member.specialization && (
                    <div className="flex items-start gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      <span className="text-gray-600">{member.specialization}</span>
                    </div>
                  )}
                </div>

                {member.contribution && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-1">Contribution</p>
                    <p className="text-sm text-gray-700">{member.contribution}</p>
                  </div>
                )}

                {member.programming_languages && (
                  <div className="pt-3 border-t border-gray-200 mt-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {member.programming_languages.split(',').slice(0, 3).map((lang, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                        >
                          {lang.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Today's Attendance Status */}
                <div className="pt-3 border-t border-gray-200 mt-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">Today's Status</p>
                  {(() => {
                    // Find attendance data for this member by matching employee_uuid or task_id
                    const memberAttendanceData = membersWithAttendance.find(
                      m => m.employee_uuid === member.employee_uuid || m.task_id === member.task_id
                    );
                    return (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Clock In:</span>
                          <span className="font-medium text-orange-600">
                            {formatTime(memberAttendanceData?.attendance?.clock_in_time)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Clock Out:</span>
                          <span className="font-medium text-purple-600">
                            {formatTime(memberAttendanceData?.attendance?.clock_out_time)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
            <p className="text-gray-500 mb-4">Start by adding members to this project</p>
            <button 
              onClick={() => setIsAddMemberModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Add First Member
            </button>
          </div>
        )}
      </div>

      <AddMembersModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        projectId={projectId}
        currentMembers={members}
        onMemberAdded={handleMemberAdded}
      />
    </>
  );
}
