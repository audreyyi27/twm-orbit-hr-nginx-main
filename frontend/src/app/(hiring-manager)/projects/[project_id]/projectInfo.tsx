'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProjectDto, TeamDto } from '@/core/projects';

interface ProjectInfoProps {
  project: ProjectDto;
  team: TeamDto | null;
  projectId: string;
}

export default function ProjectInfo({ project, team, projectId }: ProjectInfoProps) {
  const router = useRouter();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  // Edit form state
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

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-8 shadow-sm mb-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          {/* Division Badge */}
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
  );
}

