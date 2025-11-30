'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AddMembersModal from './addMembers';
import { RemoveProjectMemberService } from '@/core/projects/service';
import type { ProjectDetailsDto, ProjectMemberDto } from '@/core/projects';

interface ProjectDetailsProps {
  projectId: string;
  data: ProjectDetailsDto;
}

export default function ProjectDetails({ projectId, data }: ProjectDetailsProps) {
  const router = useRouter();
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [localMembers, setLocalMembers] = useState<ProjectMemberDto[]>(data.members);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const members = localMembers;
  const { project, team } = data;

  // Destructure project values
  const {
    project_id,
    project_name,
    project_description,
    status,
    start_date,
    end_date,
    contact_window,
    division
  } = project;

  // Edit form state - ALL FIELDS EDITABLE
  const [editForm, setEditForm] = useState({
    project_name: project_name,
    project_description: project_description || '',
    status: status || 'Active',
    contact_window: contact_window || '',
    start_date: start_date || '',
    end_date: end_date || '',
    division: division || '',
  });

  const team_name = team?.team_name;
  const member_count = members.length;

  // Status styling
  const statusConfig = {
    active: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
    completed: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
    'on-hold': { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
    pending: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
  };

  const currentStatus = isEditMode ? editForm.status : status;
  const statusStyle = statusConfig[currentStatus?.toLowerCase() as keyof typeof statusConfig] || statusConfig.active;

  const handleEditChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let targetId = projectId || project_id;
      if (!targetId || typeof targetId !== 'string') {
        console.error('Missing project id for update. projectId:', projectId, 'project_id:', project_id);
        alert('Unable to update: missing project ID. Please reload the page and try again.');
        return;
      }
      // Sanitize any stray characters (e.g., angle brackets)
      targetId = targetId.replace(/[<>\s]/g, '');
      const response = await fetch(`/api/projects/${targetId}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (response.status === 401 || response.status === 403) {
        alert('Your session has expired. Please log in again.');
        router.push('/');
        return;
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to update project');
      }

      setIsEditMode(false);
      router.refresh();
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      project_name: project_name,
      project_description: project_description || '',
      status: status || 'Active',
      contact_window: contact_window || '',
      start_date: start_date || '',
      end_date: end_date || '',
      division: division || '',
    });
    setIsEditMode(false);
  };

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
      </button>

      {/* Project Header */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8 shadow-sm mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            {/* Division Badge - Shows current value */}
            {(division || isEditMode) && (
              <div className="mb-3">
                <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                  {isEditMode ? editForm.division || 'Division' : division}
                </span>
              </div>
            )}

            {/* Project Name - Editable */}
            {!isEditMode ? (
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                {project_name}
              </h1>
            ) : (
              <input
                type="text"
                value={editForm.project_name}
                onChange={(e) => handleEditChange('project_name', e.target.value)}
                className="text-4xl font-bold text-gray-900 mb-3 w-full border-2 border-blue-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            {team && (
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="font-medium">{team_name}</span>
                {team.team_description && (
                  <span className="text-gray-400">• {team.team_description}</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Status - Editable Dropdown */}
            {!isEditMode ? (
              <div className={`px-4 py-2 rounded-full ${statusStyle.bg} flex items-center gap-2`}>
                <span className={`w-2.5 h-2.5 rounded-full ${statusStyle.dot}`}></span>
                <span className={`text-sm font-medium ${statusStyle.text} capitalize`}>
                  {status || 'active'}
                </span>
              </div>
            ) : (
              <select
                value={editForm.status}
                onChange={(e) => handleEditChange('status', e.target.value)}
                className="px-4 py-2 border-2 border-blue-500 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            )}

            {/* Edit/Save/Cancel Buttons */}
            {!isEditMode ? (
              <button
                onClick={() => setIsEditMode(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Edit Project
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-green-400"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Left Column - Project Info */}
          <div className="space-y-4">
            {/* Project ID - Not Editable */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Project ID</p>
              <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg">
                <p className="text-gray-900 font-mono text-base">{project_id}</p>
              </div>
            </div>

            {/* Division - EDITABLE */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Division</p>
              {!isEditMode ? (
                <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg">
                  <p className="text-gray-900 text-base">{division || 'Not set'}</p>
                </div>
              ) : (
                <input
                  type="text"
                  value={editForm.division}
                  onChange={(e) => handleEditChange('division', e.target.value)}
                  className="w-full p-3 bg-white border-2 border-blue-500 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter division"
                />
              )}
            </div>

            {/* Contact Window - Editable */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Contact Window</p>
              {!isEditMode ? (
                <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg">
                  <p className="text-gray-900 text-base">{contact_window || 'Not set'}</p>
                </div>
              ) : (
                <input
                  type="text"
                  value={editForm.contact_window}
                  onChange={(e) => handleEditChange('contact_window', e.target.value)}
                  className="w-full p-3 bg-white border-2 border-blue-500 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Mon-Fri 9AM-5PM"
                />
              )}
            </div>

            {/* Start Date - Editable */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Start Date</p>
              {!isEditMode ? (
                <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg">
                  <p className="text-gray-900 text-base">
                    {start_date 
                      ? new Date(start_date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      : 'Not set'
                    }
                  </p>
                </div>
              ) : (
                <input
                  type="date"
                  value={editForm.start_date}
                  onChange={(e) => handleEditChange('start_date', e.target.value)}
                  className="w-full p-3 bg-white border-2 border-blue-500 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {/* End Date - Editable */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">End Date</p>
              {!isEditMode ? (
                <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg">
                  <p className="text-gray-900 text-base">
                    {end_date 
                      ? new Date(end_date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      : 'Not set'
                    }
                  </p>
                </div>
              ) : (
                <input
                  type="date"
                  value={editForm.end_date}
                  onChange={(e) => handleEditChange('end_date', e.target.value)}
                  className="w-full p-3 bg-white border-2 border-blue-500 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {/* Member Count - Not Editable */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Team Members Count</p>
              <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg">
                <p className="text-gray-900 text-base font-medium">
                  {member_count}  
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Project Description - EDITABLE */}
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-gray-700 mb-2">Project Description</p>
            {!isEditMode ? (
              <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg flex-1">
                <p className="text-gray-900 text-base leading-relaxed">
                  {project_description || 'No description provided'}
                </p>
              </div>
            ) : (
              <textarea
                value={editForm.project_description}
                onChange={(e) => handleEditChange('project_description', e.target.value)}
                className="w-full p-3 bg-white border-2 border-blue-500 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 resize-none"
                placeholder="Enter project description"
                rows={6}
              />
            )}
          </div>
        </div>

        {/* Team - Not Editable (Read-only) */}
        {team_name && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Team</p>
            <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg">
              <p className="text-gray-900 text-base">{team_name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Team Members Section - (same as before) */}
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
    </div>
  );
}