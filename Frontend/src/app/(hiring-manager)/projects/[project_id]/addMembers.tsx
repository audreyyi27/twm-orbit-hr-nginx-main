'use client';

import { useState, useEffect } from 'react';
import { GetAvailableEmployeesService, AddProjectMemberService } from '@/core/projects/service';
import type { TeamGroup, AddMembersModalProps } from '@/core/projects/dto';



export default function AddMembersModal({
  isOpen,
  onClose,
  projectId,
  onMemberAdded,
}: AddMembersModalProps) {
  const [employees, setEmployees] = useState<TeamGroup[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [contribution, setContribution] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
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
      
      setEmployees((result.data as TeamGroup[]) || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load employees';
      setError(errorMessage);
      console.error(err);
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

    try {
      const result = await AddProjectMemberService(projectId, {
        employee_uuid: selectedEmployee,
        contribution: contribution || undefined,
      });

      if (result.isError) {
        throw new Error(result.message || 'Failed to add member');
      }

      onMemberAdded();
      handleClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add member';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedEmployee('');
    setContribution('');
    setError('');
    setSearchTerm('');
    onClose();
  };

  // Filter employees based on search term
  const filteredEmployees = employees.map(team => ({
    ...team,
    members: team.members.filter(employee => {
      const searchLower = searchTerm.toLowerCase();
      return (
        employee.name?.toLowerCase().includes(searchLower) ||
        employee.chinese_name?.toLowerCase().includes(searchLower) ||
        employee.employee_id?.toLowerCase().includes(searchLower) ||
        employee.role?.toLowerCase().includes(searchLower)
      );
    })
  })).filter(team => team.members.length > 0);

  // Get selected employee details
  const selectedEmployeeData = employees
    .flatMap(team => team.members)
    .find(emp => emp.uuid === selectedEmployee);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">Add Team Member</h2>
              <p className="text-orange-100 text-sm">Select an employee to add to this project</p>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee Select with Search */}
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-3">
                Select Employee <span className="text-orange-500">*</span>
              </label>
              
              {isLoadingEmployees ? (
                <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-orange-500 mb-3"></div>
                  <p className="text-gray-600 font-medium">Loading employees...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Search Input */}
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name, ID, or role..."
                      className="w-full pl-10 pr-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    />
                  </div>

                  {/* Dropdown */}
                  <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white cursor-pointer"
                    required
                    size={8}
                  >
                    <option value="">-- Select an employee --</option>
                    {filteredEmployees.map((team) => (
                      <optgroup key={team.team_name} label={`📁 ${team.team_name}`}>
                        {team.members.map((employee) => (
                          <option key={employee.uuid} value={employee.uuid} className="py-2">
                            {employee.name}
                            {employee.chinese_name && ` (${employee.chinese_name})`}
                            {employee.employee_id && ` • ID: ${employee.employee_id}`}
                            {employee.role && ` • ${employee.role}`}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>

                  {/* Selected Employee Info */}
                  {selectedEmployeeData && (
                    <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-xl">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {selectedEmployeeData.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4 flex-1">
                          <h4 className="font-semibold text-gray-900 text-lg">{selectedEmployeeData.name}</h4>
                          {selectedEmployeeData.chinese_name && (
                            <p className="text-gray-600 text-sm">{selectedEmployeeData.chinese_name}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedEmployeeData.employee_id && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                ID: {selectedEmployeeData.employee_id}
                              </span>
                            )}
                            {selectedEmployeeData.role && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                {selectedEmployeeData.role}
                              </span>
                            )}
                            {selectedEmployeeData.team && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {selectedEmployeeData.team}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-gray-500 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Use search to quickly find employees. Employees are grouped by teams.
                  </p>
                </div>
              )}
            </div>

            {/* Contribution Input */}
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-3">
                Contribution <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                value={contribution}
                onChange={(e) => setContribution(e.target.value)}
                placeholder="Describe their role or contribution to this project... (e.g., Frontend Developer, Project Manager, Technical Consultant)"
                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none"
                rows={4}
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-gray-500">
                  Help team members understand their role in the project
                </p>
                <p className="text-sm font-medium text-gray-600">
                  {contribution.length}/500
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-8 py-6 bg-gray-50">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 text-base border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all duration-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading || !selectedEmployee}
              className="flex-1 px-6 py-3 text-base bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding Member...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Member
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}