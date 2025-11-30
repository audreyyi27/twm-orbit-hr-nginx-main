"use server";

import { revalidateTag } from "next/cache";
import type { 
  TeamWithDetailsDto, 
  ProjectDetailsDto, 
  ProjectDashboardDto,
  AddProjectMemberRequest,
  AvailableEmployeesResponse,
  EmployeeProjectTaskResponse,
} from "./dto";
import { 
  getTeamsWithDetails, 
  getProjectDetails, 
  getProjectsDashboard,
  getAvailableEmployees,
  addProjectMember,
  removeProjectMember,
  updateProject  // Add this import
} from "./api";

export interface ServiceResponse<T> {
  data?: T;
  isError: boolean;
  message?: string;
  statusCode?: number;
}

export const GetProjectsDashboardService = async (): Promise<ServiceResponse<ProjectDashboardDto>> => {
  try {
    const res = await getProjectsDashboard();

    if (res.error) {
      return { isError: true, message: res.error.message, statusCode: res.statusCode };
    }

<<<<<<< HEAD:Frontend/src/core/projects/service.ts
=======
    // Handle both direct data and wrapped data
>>>>>>> d72129bf2b4a1a853da9e59a0b8d4104b9050b5a:frontend/src/core/projects/service.ts
    const dashboardData = (res.data && typeof res.data === 'object' && 'items' in res.data) 
      ? (res.data as { items: ProjectDashboardDto }).items 
      : res.data;

    return {
      data: dashboardData as ProjectDashboardDto,
      isError: false,
    };
  } catch {
    return { isError: true, message: "Failed to fetch projects dashboard" };
  }
};

export const GetTeamsWithDetailsService = async (): Promise<ServiceResponse<TeamWithDetailsDto[]>> => {
  try {
    const res = await getTeamsWithDetails();

    if (res.error) {
      return { isError: true, message: res.error.message, statusCode: res.statusCode };
    }

    return {
        data: Array.isArray(res.data) ? res.data : (res?.data?.items || []),
      isError: false,
    };
  } catch {
    return { isError: true, message: "Failed to fetch teams data" };
  }
};

export const GetProjectDetailsService = async (projectId: string): Promise<ServiceResponse<ProjectDetailsDto>> => {
  try {
    const res = await getProjectDetails(projectId);

    if (res.error) {
      return { isError: true, message: res.error.message, statusCode: res.statusCode };
    }

<<<<<<< HEAD:Frontend/src/core/projects/service.ts
=======
    // Handle both direct data and wrapped data
>>>>>>> d72129bf2b4a1a853da9e59a0b8d4104b9050b5a:frontend/src/core/projects/service.ts
    const projectData = res.data?.items || res.data;

    return {
      data: projectData as ProjectDetailsDto,
      isError: false,
    };
  } catch {
    return { isError: true, message: "Failed to fetch project details" };
  }
};

<<<<<<< HEAD:Frontend/src/core/projects/service.ts
// ADD THIS NEW SERVICE FUNCTION
export const UpdateProjectService = async (
  projectId: string,
  data: {
    project_name?: string;
    project_description?: string;
    status?: string;
    contact_window?: string;
    start_date?: string;
    end_date?: string;
    division?: string;
  }
): Promise<ServiceResponse<ProjectDetailsDto>> => {
  try {
    const res = await updateProject(projectId, data);

    if (res.error) {
      return { isError: true, message: res.error.message, statusCode: res.statusCode };
    }

    const projectData = res.data?.items || res.data;

    return {
      data: projectData as ProjectDetailsDto,
      isError: false,
    };
  } catch {
    return { isError: true, message: "Failed to update project" };
  }
};

=======
>>>>>>> d72129bf2b4a1a853da9e59a0b8d4104b9050b5a:frontend/src/core/projects/service.ts
export const GetAvailableEmployeesService = async (): Promise<ServiceResponse<AvailableEmployeesResponse[]>> => {
  try {
    const res = await getAvailableEmployees();

    if (res.error) {
      return { isError: true, message: res.error.message, statusCode: res.statusCode };
    }

<<<<<<< HEAD:Frontend/src/core/projects/service.ts
=======
    // Handle both direct data and wrapped data
>>>>>>> d72129bf2b4a1a853da9e59a0b8d4104b9050b5a:frontend/src/core/projects/service.ts
    const employeesData = Array.isArray(res.data) 
      ? res.data 
      : (res.data && typeof res.data === 'object' && 'items' in res.data && Array.isArray(res.data.items))
        ? res.data.items
        : [];

    return {
      data: employeesData,
      isError: false,
    };
  } catch {
    return { isError: true, message: "Failed to fetch available employees" };
  }
};

export const AddProjectMemberService = async (
  projectId: string,
  data: Omit<AddProjectMemberRequest, "project_id">
): Promise<ServiceResponse<EmployeeProjectTaskResponse>> => {
  try {
    const payload: AddProjectMemberRequest = {
      ...data,
      project_id: projectId,
    };

    const res = await addProjectMember(projectId, payload);

    if (res.error) {
      return { isError: true, message: res.error.message, statusCode: res.statusCode };
    }

<<<<<<< HEAD:Frontend/src/core/projects/service.ts
=======
    // Handle both direct data and wrapped data
>>>>>>> d72129bf2b4a1a853da9e59a0b8d4104b9050b5a:frontend/src/core/projects/service.ts
    const memberData = (res.data && typeof res.data === 'object' && 'items' in res.data)
      ? res.data.items
      : res.data;

    return {
      data: memberData as EmployeeProjectTaskResponse,
      isError: false,
    };
  } catch {
    return { isError: true, message: "Failed to add project member" };
  }
};

export const RemoveProjectMemberService = async (
  projectId: string,
  taskId: string
): Promise<ServiceResponse<{ message: string }>> => {
  try {
    const res = await removeProjectMember(projectId, taskId);

    if (res.error) {
      let errorMessage = res.error.message;
      try {
        const parsedError = JSON.parse(res.error.message);
        errorMessage = parsedError.detail || parsedError.message || res.error.message;
      } catch {
        errorMessage = res.error.message;
      }
      
      return { 
        isError: true, 
        message: errorMessage, 
        statusCode: res.statusCode 
      };
    }

<<<<<<< HEAD:Frontend/src/core/projects/service.ts
=======
    // Handle both direct data and wrapped data
>>>>>>> d72129bf2b4a1a853da9e59a0b8d4104b9050b5a:frontend/src/core/projects/service.ts
    const responseData = (res.data && typeof res.data === 'object' && 'items' in res.data)
      ? res.data.items
      : res.data;

    return {
      data: responseData as { message: string },
      isError: false,
    };
  } catch {
    return { isError: true, message: "Failed to remove project member" };
  }
};