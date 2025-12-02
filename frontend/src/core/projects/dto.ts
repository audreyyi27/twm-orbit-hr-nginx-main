// TypeScript DTOs matching Python Pydantic schemas and database structure

// ============================================
// BASE DTOs
// ============================================
export interface TeamDto {
  team_id: string;
  team_name: string;
  team_description?: string;
}

export interface ProjectDto {
  project_id: string;
  project_name: string;
  project_description?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  division?: string;
  contact_window?: string;
  completed_date?: string;
  department?: string;
}

export interface EmployeeDto {
  uuid: string;
  team?: string;
  team_id?: string;
  name?: string;
  chinese_name?: string;
  employee_id?: string; 
  email?: string;
  phone_no?: string;
  role?: string;
  specialization?: string;
  programming_languages?: string;
  frameworks_libraries?: string;
  tools_platforms?: string;
  databases?: string;
  it_field_work_experience?: number;
  ios_android?: string;
  current_projects?: string;
  start_date?: string;
  end_date?: string;
  job_desc?: string;
  nt_account?: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// PROJECT DASHBOARD DTOs
// ============================================
export interface ProjectMemberDto {
  task_id: string;
  employee_uuid: string;
  name?: string;
  chinese_name?: string;
  employee_id?: string;
  email?: string;
  role?: string;
  team_name?: string;
  specialization?: string;
  programming_languages?: string;
  contribution?: string;
}

export interface ProjectCardDto {
  project_id: string;
  project_name: string;
  project_description?: string;
  status?: string;
  start_date?: string;
  completed_date?: string;
  department?: string;
  team_name?: string;
  member_count: number;
  division?: string;
  end_date?: string;
  contact_window?: string;
  members?: ProjectMemberDto[];
}

export interface ProjectDetailsDto {
  project: ProjectDto;
  team: TeamDto | null;
  members: ProjectMemberDto[];
}

export interface ProjectDashboardDto {
  projects: ProjectCardDto[];
  total_projects: number;
  active_projects: number;
  completed_projects: number;
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
  members: EmployeeDto[];
}

export interface AvailableEmployeesResponse {
  team_name: string;
  members: Array<{
    uuid: string;
    name?: string;
    chinese_name?: string;
    employee_id?: string;
    email?: string;
    role?: string;
    team?: string;
  }>;
}

// ============================================
// MODAL & REQUEST DTOs
// ============================================
export interface AddMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onMemberAdded: (member?: ProjectMemberDto) => void;
}

export interface AddProjectMemberRequest {
  employee_uuid: string;
  project_id: string;
  contribution?: string;
}

export interface EmployeeProjectTaskResponse {
  task_id: string;
  employee_uuid: string;
  project_id: string;
  contribution?: string;
}



// ==================== ATTENDANCE DTOs ====================
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

export interface ProjectMemberAttendanceResponse {
  task_id: string;
  employee_uuid: string;
  employee_id?: string | null;
  name?: string | null;
  chinese_name?: string | null;
  email?: string | null;
  role?: string | null;
  team_name?: string | null;
  nt_account?: string | null;
  contribution?: string | null;
  programming_languages?: string | null;
  attendance?: AttendanceDto | null;
  leave?: import('../employees/dto').AttendanceLeaveDto[] | null;
  overtime?: import('../employees/dto').AttendanceOvertimeDto[] | null;
}