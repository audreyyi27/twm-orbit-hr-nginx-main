// Simple Service Layer - use DTO directly!

<<<<<<< HEAD:Frontend/src/core/employees/service.ts
import type { EmployeeDto, GetEmployeesDto,  TeamProjectsDto, EmployeeProjectDto } from "./dto";
import { getEmployees, getEmployee, getEmployeeWithProjects, getTeamProjects } from "./api";
=======
import type { EmployeeDto, GetEmployeesDto } from "./dto";
import { getEmployees, getEmployee } from "./api";
>>>>>>> d72129bf2b4a1a853da9e59a0b8d4104b9050b5a:frontend/src/core/employees/service.ts
import type { BaseMeta } from "../types/api";

export interface ServiceResponse<T> {
  data?: T;
  meta?: BaseMeta;
  isError: boolean;
  message?: string;
  statusCode?: number;
}

// Get list of employees
export const GetEmployeesService = async (
  params: GetEmployeesDto
): Promise<ServiceResponse<EmployeeDto[]>> => {
  try {
    const res = await getEmployees(params);

    if (res.error) {
      return { isError: true, message: res.error.message, statusCode: res.statusCode };
    }

    return {
      data: res.data?.items || [],  // ← Use DTO directly, no transform!
      meta: res.data?.meta,
      isError: false,
    };
  } catch {
    return { isError: true, message: "Failed to fetch employees" };
  }
};

// Get single employee
export const GetEmployeeService = async (
  id: string
): Promise<ServiceResponse<EmployeeDto>> => {
  try {
    const res = await getEmployee(id);

    if (res.error) {
      return { isError: true, message: res.error.message, statusCode: res.statusCode };
    }

    // Handle both direct data and wrapped data structure
    const employeeData = res.data?.items || res.data;

    if (!employeeData) {
      return { isError: true, message: "Employee not found", statusCode: 404 };
    }

    return {
      data: employeeData as EmployeeDto,
      isError: false,
    };
  } catch {
    return { isError: true, message: "Failed to fetch employee" };
  }
};



// Get Employee with all their projects 


export const GetEmployeeWithPorjectsService = async (
  id: string 

): Promise<ServiceResponse<EmployeeProjectDto>> => {

  try {

    const res = await getEmployeeWithProjects(id);

    if(res.error){
      return { isError: true, message: res.error.message, statusCode: res.statusCode };
    }
  

    const employeeData = res.data?.items || res.data;

    if (!employeeData) {
      return { isError: true, message: "Employee not found", statusCode: 404 };
    }

    return {
      data: employeeData as EmployeeProjectDto,
      isError: false,
    };
  } catch {
    return { isError:true, message: "Failed to fetch employee projects"};
  }
};


// Get Team with all members and their projects 

export const GetTeamProjectService = async (
  teamName: string
): Promise<ServiceResponse<TeamProjectsDto>> => {
  try {
    const res = await getTeamProjects(teamName);

    if (res.error) {
      return { isError: true, message: res.error.message, statusCode: res.statusCode };
    }

    // Backend returns data directly, not wrapped in items
    const teamProject = res.data;
    
    if (!teamProject) {
      return { isError: true, message: "Team not found", statusCode: 404 };
    }

    return {
      data: teamProject as TeamProjectsDto,
      isError: false,
    };
  } catch (error) {
    console.error("GetTeamProjectService error:", error);
    return { isError: true, message: "Failed to fetch team projects" };
  }
}


