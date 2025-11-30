'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import ProjectCard from './projectCard';
import type { ProjectCardDto } from '@/core/projects';

interface ProjectsClientProps {
  projects: ProjectCardDto[];
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
}

export default function ProjectsClient({
  projects: initialProjects,
  totalProjects: initialTotalProjects,
  activeProjects: initialActiveProjects,
  completedProjects: initialCompletedProjects,
  
}: ProjectsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Local state that syncs with server props
  const [projects, setProjects] = useState(initialProjects);
  const [totalProjects, setTotalProjects] = useState(initialTotalProjects);
  const [activeProjects, setActiveProjects] = useState(initialActiveProjects);
  const [completedProjects, setCompletedProjects] = useState(initialCompletedProjects);
  
  // Sync with server props when they change (happens on refresh)
  useEffect(() => {
    setProjects(initialProjects);
    setTotalProjects(initialTotalProjects);
    setActiveProjects(initialActiveProjects);
    setCompletedProjects(initialCompletedProjects);
  }, [initialProjects, initialTotalProjects, initialActiveProjects, initialCompletedProjects]);
<<<<<<< HEAD:Frontend/src/app/(hiring-manager)/projects/projectsList.tsx
=======
  
  // Refresh data immediately when component mounts or pathname changes
  useEffect(() => {
    router.refresh();
  }, [pathname, router]);

>>>>>>> d72129bf2b4a1a853da9e59a0b8d4104b9050b5a:frontend/src/app/(hiring-manager)/projects/projectsList.tsx

  // Filter projects based on search query and status
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (project) => project.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Filter by search query (searches in name, description, department, division, contact_window)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((project) => {
        const searchableFields = [
          project.project_name,
          project.project_description,
<<<<<<< HEAD:Frontend/src/app/(hiring-manager)/projects/projectsList.tsx
=======
          project.department,
>>>>>>> d72129bf2b4a1a853da9e59a0b8d4104b9050b5a:frontend/src/app/(hiring-manager)/projects/projectsList.tsx
          project.division,
          project.contact_window,
        ];
        return searchableFields.some((field) =>
          field?.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [projects, searchQuery, statusFilter]);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div >
      {/* Header with Stats */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Projects Dashboard 📊</h1>
            <p className="text-gray-600">Manage and track all your projects</p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isEditMode 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isEditMode ? (
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
                  Delete Projects
                </span>
              )}
            </button>
            
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm">
              + New Project
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Projects</p>
                <p className="text-3xl font-bold text-gray-900">{totalProjects}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Active Projects</p>
                <p className="text-3xl font-bold text-green-600">{activeProjects}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
                <p className="text-3xl font-bold text-purple-600">{completedProjects}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by name, description, department, division, or contact..."
            className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg className="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 text-sm font-medium ${
              statusFilter === 'all'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Projects
            <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
              {projects.length}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-2 text-sm font-medium ${
              statusFilter === 'active'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Active
            <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
              {projects.filter(p => p.status?.toLowerCase() === 'active').length}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 text-sm font-medium ${
              statusFilter === 'completed'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Completed
            <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
              {projects.filter(p => p.status?.toLowerCase() === 'completed').length}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter('on-hold')}
            className={`px-4 py-2 text-sm font-medium ${
              statusFilter === 'on-hold'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            On Hold
            <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
              {projects.filter(p => p.status?.toLowerCase() === 'on-hold').length}
            </span>
          </button>
        </div>
      </div>

      {/* Results Count */}
      {(searchQuery || statusFilter !== 'all') && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Found <span className="font-semibold text-gray-900">{filteredProjects.length}</span> project{filteredProjects.length !== 1 ? 's' : ''}
            {searchQuery && <span> matching &quot;{searchQuery}&quot;</span>}
          </p>
          {(searchQuery || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard 
              key={project.project_id} 
              project={project}
              isEditMode={isEditMode}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            {searchQuery || statusFilter !== 'all' ? (
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || statusFilter !== 'all' ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Get started by creating your first project'}
          </p>
          {!(searchQuery || statusFilter !== 'all') && (
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              + Create Project
            </button>
            )}
        </div>
      )}
    </div>
  );
}