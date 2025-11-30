// core/employees/dto.ts

// Simple Employee DTO (matches actual database)
export interface EmployeeDto {
  uuid: string;
  team?: string;
  name?: string;
  chinese_name?: string;
  employee_id?: string; 
  email?: string;
  phone_no?: string;
  it_field_work_experience?: string;  
  programming_languages?: string;
  frameworks_libraries?: string;
  tools_platforms?: string;
  databases?: string;
  specialization?: string;
  ios_android?: string;
  current_projects?: string;
  start_date?: string;
  end_date?: string;
  role?: string;
  job_desc?: string;
  nt_account?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GetEmployeesDto {
  page: string;
  perPage: string;
  search?: string;
}

// Orbit Projects table
export interface OrbitProjectDto {
  project_id: string; // uuid
  project_name: string;
  project_description?: string;
  status?: string; // e.g., 'active', 'completed', 'on-hold'
  start_date?: string;
  end_date?: string;
  
  division?: string;
}

// Employee Project Tasks table (junction/linking table)
export interface EmployeeProjectTaskDto {
  task_id: string; // uuid
  employee_uuid: string; // FK to employees
  project_id: string; // FK to orbit_projects
  contribution?: string;
}

// Simple - Employee with all their current projects
export interface EmployeeProjectDto {
  // Employee info
  uuid: string;
  name?: string;
  chinese_name?: string;
  employee_id?: string;
  email?: string;
  role?: string;
  team?: string;
  
  // All their projects (array)
  projects: {
    task_id: string;
    project_id: string;
    project_name: string;
    project_description?: string;
    contribution?: string;
    contact_window?: string;
    division?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  }[];
}

// Simple - Team with all members and all projects they're doing
export interface TeamProjectsDto {
  team_name: string;
  members: EmployeeProjectDto[]; // All 5 employees with their projects
}