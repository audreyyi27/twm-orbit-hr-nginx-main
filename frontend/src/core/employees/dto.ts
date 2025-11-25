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

