'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { ProjectCardDto } from '@/core/projects';

interface ProjectCardProps {
  project: ProjectCardDto;
  isEditMode?: boolean;
}

export default function ProjectCard({ project, isEditMode = false }: ProjectCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const {
    project_id,
    project_name,
    project_description,
    status,
    start_date,
    end_date,
    contact_window,
    division,
    completed_date,
    department,
    team_name,
    member_count = 0,
    members = [],
  } = project;

  // Status styling
  const statusConfig = {
    active: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
    completed: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
    'on-hold': { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
    pending: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
  };

  const statusStyle = statusConfig[status?.toLowerCase() as keyof typeof statusConfig] || statusConfig.active;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm(`Are you sure you want to delete project "${project_name}"?`)) {
      return;
    }

    setIsDeleting(true);
    
    try {
      // TODO: Call delete API when backend is ready
      alert('Delete functionality will be implemented with backend API');
    } catch (error) {
      alert('Failed to delete project');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const CardContent = () => (
    <div className="bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer h-full flex flex-col relative">
      {/* Delete Button - Only visible in edit mode */}
      {isEditMode && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute top-3 right-3 p-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
          title="Delete project"
        >
          {isDeleting ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      )}
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {/* Department Badge */}
          {department && (
            <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium mb-2">
              {department}
            </span>
          )}
          
          {/* Project Name */}
          <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
            {project_name}
          </h3>
          
          {/* Team Name */}
          {team_name && (
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {team_name}
            </p>
          )}
        </div>

        {/* Status Badge */}
        <div className={`px-3 py-1 rounded-full ${statusStyle.bg} flex items-center gap-1.5`}>
          <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`}></span>
          <span className={`text-xs font-medium ${statusStyle.text} capitalize`}>
            {status || 'active'}
          </span>
        </div>
      </div>

      {/* Description */}
{project_description && (
  <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-grow leading-snug">
    {project_description}
  </p>
)}

{contact_window && (
  <div className="mb-4 flex items-center gap-2 text-xs text-gray-600 leading-tight">
    <span className="font-medium">Department / Division :</span>
    <span>{division}</span>
  </div>
)}

      {/* Dates */}
      {(start_date || end_date || completed_date) && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          {start_date && (
            <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">Started:</span>
              <span>{new Date(start_date as string).toLocaleDateString()}</span>
            </div>
          )}
          {end_date && (
            <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">End:</span>
              <span>{new Date(end_date as string).toLocaleDateString()}</span>
            </div>
          )}
          {completed_date && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Completed:</span>
              <span>{new Date(completed_date as string).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Contact Window */}
      {contact_window && (
        <div className="mb-4 flex items-center gap-2 text-xs text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="font-medium">Contact Window:</span>
          <span>{contact_window}</span>
        </div>
      )}

      {/* Footer: Team Members */}
      <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Member Avatars */}
          <div className="flex -space-x-2">
            {Array.isArray(members) && members.length > 0 ? (
              <>
                {members.slice(0, 4).map((member, index) => (
                  <div
                    key={member.employee_uuid || `member-${index}`}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                    title={member.name || 'Unknown'}
                  >
                    {(member.name || 'U').charAt(0).toUpperCase()}
                  </div>
                ))}
                {member_count > 4 && (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-xs font-bold border-2 border-white">
                    +{member_count - 4}
                  </div>
                )}
              </>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            )}
          </div>
          
          {/* Member Count */}
          <span className="text-sm text-gray-600 font-medium">
            {member_count} {member_count === 1 ? 'member' : 'members'}
          </span>
        </div>

        {/* Arrow Icon */}
        <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );

  // If edit mode, don't wrap with Link
  if (isEditMode) {
    return <CardContent />;
  }

  // Normal mode, wrap with Link
  return (
    <Link href={`/projects/${project_id}`}>
      <CardContent />
    </Link>
  );
}
