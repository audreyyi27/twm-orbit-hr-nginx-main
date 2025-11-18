// TypeScript DTOs matching Python Pydantic schemas and database structure

// ============================================
// TEAM DTOs
// ============================================
export interface TeamDto {
  team_id: string;  // Format: team_1, team_2, etc.
  team_name: string;
  team_description?: string;
}

// ============================================
// PROJECT DTOs (employee_projects table)
// ============================================
export interface ProjectDto {
  project_id: string;  // UUID as string
  project_name: string;
  project_description?: string;
  status?: string;  // e.g., "active", "completed", "on-hold"
  start_date?: string;  // ISO date string (YYYY-MM-DD)
  completed_date?: string;  // ISO date string (YYYY-MM-DD)
  department?: string;
 
}

// ============================================
// EMPLOYEE DTOs
// ============================================
export interface CandidateSnapshot {
  uuid: string;
  name?: string;
  email?: string;
  status?: string;
}

export interface EmployeeDto {
  uuid: string;
  team?: string;
  team_id?: string;  // Format: team_1, team_2, etc.
  name?: string;
  chinese_name?: string;
  employee_id?: string; 
  email?: string;
  phone_no?: string;
  it_field_work_experience?: number;  // Integer
  programming_languages?: string;
  frameworks_libraries?: string;
  tools_platforms?: string;
  databases?: string;
  specialization?: string;
  ios_android?: string;
  current_projects?: string;
  start_date?: string;  // ISO date string (YYYY-MM-DD)
  end_date?: string;  // ISO date string (YYYY-MM-DD)
  role?: string;
  job_desc?: string;
  nt_account?: string;
  created_at?: string;  // ISO datetime string
  updated_at?: string;  // ISO datetime string
  candidate?: CandidateSnapshot | null;
}

// ============================================
// EMPLOYEE-PROJECT RELATIONSHIP DTOs (employee_projects_tasks table)
// ============================================

// Basic task assignment (junction table)
export interface EmployeeProjectTaskDto {
  task_id: string;  // UUID as string
  employee_uuid: string;  // UUID as string
  project_id: string;  // UUID as string
  contribution?: string;  // Description of employee's contribution
}

// Task with populated employee and project names (for display)
export interface EmployeeProjectTaskWithDetailsDto {
  task_id: string;
  employee_uuid: string;
  employee_name?: string;  // From employee table
  project_id: string;
  project_name?: string;  // From employee_projects table
  contribution?: string;
}

// For creating new task assignments
export interface EmployeeProjectTaskCreateDto {
  employee_uuid: string;
  project_id: string;
  contribution?: string;
}

// ============================================
// PROJECT DASHBOARD DTOs
// ============================================

// Employee info for project members list
export interface ProjectMemberDto {
  task_id: string;  // For managing the assignment
  employee_uuid: string;
  name?: string;
  chinese_name?: string;
  employee_id?: string;
  email?: string;
  role?: string;
  team_name?: string;  // Employee's team name
  specialization?: string;
  programming_languages?: string;
  contribution?: string;  // Their contribution to this project
}

// Project card/box for dashboard
export interface ProjectCardDto {
  project_id: string;
  project_name: string;
  project_description?: string;
  status?: string;
  start_date?: string;
  completed_date?: string;
  department?: string;
  team_id?: string;  // Optional: Team context from where project is being viewed
  team_name?: string;  // Optional: Team name for display context
  member_count: number;  // Count of employees assigned to this project
  members?: ProjectMemberDto[];  // List of employees working on this project
}

// Detailed project view
export interface ProjectDetailsDto {
  project: ProjectDto;
  team: TeamDto | null;
  members: ProjectMemberDto[];  // Employees with their contributions
}

// For dashboard: all projects overview
export interface ProjectDashboardDto {
  projects: ProjectCardDto[];
  total_projects: number;
  active_projects: number;
  completed_projects: number;
}





// Modal props
export interface AddMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onMemberAdded: () => void;
}


export interface AddProjectMemberRequest {
  employee_uuid: string;
  project_id: string;
  contribution?: string;
}


// ============================================
// TEAM MANAGEMENT DTOs
// ============================================
export interface TeamWithDetailsDto {
  team: TeamDto;
  projects: ProjectDto[];
  members: EmployeeDto[];
}

export interface TeamGroup {
  team_name: string;
  members: EmployeeDto[];  // Reuse existing EmployeeDto
}