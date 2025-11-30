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

// Team members + All projects
export interface TeamProjectsDto {
  team_name: string;
  members: EmployeeProjectDto[]; // All 5 employees with their projects
}





// ===================Attendance=========================
export interface AttendanceDto {
  id: string;
  user_id: string;
  attendance_date?: string;
  clock_in_time?: string | null;
  clock_in_latitude?: number | null;
  clock_in_longitude?: number | null;
  clock_in_address?: string | null;
  clock_out_time?: string | null;
  clock_out_latitude?: number | null;
  clock_out_longitude?: number | null;
  clock_out_address?: string | null;
  work_description?: string | null;
  reason?: string | null;
  status?: string | null;
  plan?: string | null;
  nt_account?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ==================== LEAVE DTOs ====================
export interface AttendanceLeaveDto {
  user_id: string;
  type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  duration?: string | null;
  status?: string;
  reason?: string | null;
}





// ==================== OVERTIME DTOs ====================
export interface AttendanceOvertimeDto {
  user_id: string;
  type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  duration?: string | null;
  reason?: string | null;
  status?: string;
}





// ==================== USER DTOs ====================
export interface AttendanceUsertemplate {
  id: string;
  username?: string | null;
  fullname?: string | null;
  employee_id?: string | null;
  email?: string | null;
  phone?: string | null;
  positions?: string | null;
  role?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}