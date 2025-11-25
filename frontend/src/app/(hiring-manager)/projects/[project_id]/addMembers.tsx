'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GetAvailableEmployeesService, AddProjectMemberService } from '@/core/projects/service';
import type { EmployeeDto, TeamGroup, ProjectMemberDto } from '@/core/projects/dto';

interface AddMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  currentMembers: ProjectMemberDto[];
  onMemberAdded: (member?: ProjectMemberDto) => void;
}

export default function AddMembersModal({
  isOpen,
  onClose,
  projectId,
  currentMembers,
  onMemberAdded,
}: AddMembersModalProps) {
  const router = useRouter();
  const [employees, setEmployees] = useState<TeamGroup[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [contribution, setContribution] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [recentlyAdded, setRecentlyAdded] = useState<EmployeeDto[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
      setRecentlyAdded([]);
      setSuccess('');
      setError('');
    }
  }, [isOpen]);

  const fetchEmployees = async () => {
    setIsLoadingEmployees(true);
    setError('');
    
    try {
      const result = await GetAvailableEmployeesService();
      
      if (result.isError) {
        throw new Error(result.message || 'Failed to fetch employees');
      }
      
      const teams = (result.data || []).map(team => ({
        team_name: team.team_name || 'No Team',
        members: (team.members || []).map(employee => ({
          ...employee,
          team_name: team.team_name || 'No Team'
        }))
      })).filter(team => team.members.length > 0);
      
      setEmployees(teams);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load employees';
      setError(errorMessage);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployee) {
      setError('Please select an employee');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {

      const result = await AddProjectMemberService(projectId, {
        employee_uuid: selectedEmployee,
        contribution: contribution || undefined,
      });

      if (result.isError) {
        throw new Error(result.message || 'Failed to add member');
      }

      const addedEmployee = employees
        .flatMap(team => team.members)
        .find(emp => emp.uuid === selectedEmployee);

      if (addedEmployee) {
        setRecentlyAdded(prev => [...prev, addedEmployee]);
      }
      
      // Create member object for optimistic update
      const newMember: ProjectMemberDto = {
        task_id: result.data?.task_id || `temp-${Date.now()}`,
        employee_uuid: selectedEmployee,
        name: addedEmployee?.name,
        chinese_name: addedEmployee?.chinese_name,
        employee_id: addedEmployee?.employee_id,
        email: addedEmployee?.email,
        role: addedEmployee?.role,
        team_name: addedEmployee?.team,
        contribution: contribution || undefined,
        programming_languages: addedEmployee?.programming_languages,
        specialization: addedEmployee?.specialization,
      };
      
      // Show success and update parent immediately
      setSuccess(`✓ Added ${addedEmployee?.name || 'member'}`);
      setSelectedEmployee('');
      setContribution('');
      
      // Call parent handler to update UI immediately
      onMemberAdded(newMember);
      
      // Auto-close after brief success message
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 800);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add member';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromList = (employeeUuid: string) => {
    setRecentlyAdded(prev => prev.filter(emp => emp.uuid !== employeeUuid));
  };

  const handleClose = () => {
    // Check if members were added BEFORE clearing state
    const hadAddedMembers = recentlyAdded.length > 0;
    
    setSelectedEmployee('');
    setContribution('');
    setError('');
    setSuccess('');
    setSearchTerm('');
    setRecentlyAdded([]);
    
    // Close modal immediately
    onClose();
    
    // Trigger immediate refresh if members were added
    if (hadAddedMembers) {
      // Call parent handler which triggers router.refresh()
      onMemberAdded(undefined);
    }
  };

  // Filter out already-added employees from dropdown
  const excludedEmployeeUuids = new Set<string>([
    ...currentMembers.map(m => m.employee_uuid),
    ...recentlyAdded.map(e => e.uuid)
  ]);

  const filteredEmployees = employees.map(team => {
    return {
      ...team,
      members: team.members.filter(employee => {
        if (excludedEmployeeUuids.has(employee.uuid)) {
          return false;
        }

        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          return (
            employee.name?.toLowerCase().includes(searchLower) ||
            employee.chinese_name?.toLowerCase().includes(searchLower) ||
            employee.employee_id?.toLowerCase().includes(searchLower) ||
            employee.role?.toLowerCase().includes(searchLower)
          );
        }

        return true;
      })
    };
  }).filter(team => team.members.length > 0);

  const availableCount = filteredEmployees.reduce((sum, team) => sum + team.members.length, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg border border-gray-200 shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add Team Member</h2>
              <p className="text-sm text-gray-600 mt-1">
                {availableCount} {availableCount === 1 ? 'employee' : 'employees'} available
                {recentlyAdded.length > 0 && ` • ${recentlyAdded.length} added`}
              </p>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 rounded-lg p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {recentlyAdded.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Added ({recentlyAdded.length})
              </h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {recentlyAdded.map((employee) => (
                  <div key={employee.uuid} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                    <span className="text-sm text-gray-900 truncate">{employee.name}</span>
                    <button
                      onClick={() => handleRemoveFromList(employee.uuid)}
                      className="ml-2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="employee-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select Employee <span className="text-red-500">*</span>
              </label>
              
              {isLoadingEmployees ? (
                <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                  <p className="text-sm text-gray-600">Loading employees...</p>
                </div>
              ) : availableCount === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">
                    {searchTerm 
                      ? 'No employees match your search' 
                      : 'No more employees available'}
                  </p>
                  {searchTerm && (
                    <button type="button" onClick={() => setSearchTerm('')} className="mt-2 text-sm text-blue-600 hover:text-blue-700">
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <label htmlFor="employee-search" className="sr-only">Search employees</label>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      id="employee-search"
                      name="employee-search"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name, ID, or role..."
                      className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {searchTerm && (
                      <button type="button" onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <svg className="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <select
                    id="employee-select"
                    name="employee-select"
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    required
                    size={6}
                  >
                    <option value="">-- Select an employee --</option>
                    {filteredEmployees.map((team) => (
                      <optgroup key={team.team_name} label={team.team_name}>
                        {team.members.map((employee) => (
                          <option key={employee.uuid} value={employee.uuid}>
                            {employee.name}
                            {employee.chinese_name && ` (${employee.chinese_name})`}
                            {employee.employee_id && ` • ${employee.employee_id}`}
                            {employee.role && ` • ${employee.role}`}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="contribution-textarea" className="block text-sm font-medium text-gray-700 mb-2">
                Contribution <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="contribution-textarea"
                name="contribution"
                value={contribution}
                onChange={(e) => setContribution(e.target.value)}
                placeholder="Describe their role or contribution..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1 text-right">{contribution.length}/500</p>
            </div>
          </form>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
            >
              {recentlyAdded.length > 0 ? 'Done' : 'Cancel'}
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading || !selectedEmployee || availableCount === 0}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </span>
              ) : (
                'Add Member'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}