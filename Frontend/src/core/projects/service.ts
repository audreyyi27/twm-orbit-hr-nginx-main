"use server";

import type { 
  TeamWithDetailsDto, 
  ProjectDetailsDto, 
  ProjectDashboardDto,
  AddProjectMemberRequest,
  TeamGroup,
} from "./dto";
import { 
  getTeamsWithDetails, 
  getProjectDetails, 
  getProjectsDashboard,
  getAvailableEmployees,
  addProjectMember,
  removeProjectMember 
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

    // Handle both direct data and wrapped data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dashboardData = (res.data as any)?.items || res.data;

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: dashboardData as any,
      isError: false,
    };
  } catch (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _e: unknown
  ) {
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
  } catch (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _e: unknown
  ) {
    return { isError: true, message: "Failed to fetch teams data" };
  }
};

export const GetProjectDetailsService = async (projectId: string): Promise<ServiceResponse<ProjectDetailsDto>> => {
  try {
    const res = await getProjectDetails(projectId);

    if (res.error) {
      return { isError: true, message: res.error.message, statusCode: res.statusCode };
    }

    // Handle both direct data and wrapped data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const projectData = (res.data as any)?.items || res.data;

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: projectData as any,
      isError: false,
    };
  } catch (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _e: unknown
  ) {
    return { isError: true, message: "Failed to fetch project details" };
  }
};

export const GetAvailableEmployeesService = async (): Promise<ServiceResponse<TeamGroup[]>> => {
  try {
    const res = await getAvailableEmployees();

    if (res.error) {
      return { isError: true, message: res.error.message, statusCode: res.statusCode };
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: res.data as any,
      isError: false,
    };
  } catch (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _e: unknown
  ) {
    return { isError: true, message: "Failed to fetch available employees" };
  }
};

export const AddProjectMemberService = async (
  projectId: string,
  data: Omit<AddProjectMemberRequest, "project_id">
): Promise<ServiceResponse<Record<string, unknown>>> => {
  try {
    const payload: AddProjectMemberRequest = {
      ...data,
      project_id: projectId,
    };

    const res = await addProjectMember(projectId, payload);

    if (res.error) {
      return { isError: true, message: res.error.message, statusCode: res.statusCode };
    }

    return {
      data: res.data,
      isError: false,
    };
  } catch (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _e: unknown
  ) {
    return { isError: true, message: "Failed to add project member" };
  }
};

export const RemoveProjectMemberService = async (
  projectId: string,
  taskId: string
): Promise<ServiceResponse<Record<string, unknown>>> => {
  try {
    const res = await removeProjectMember(projectId, taskId);

    if (res.error) {
      // Try to parse error message if it's JSON
      let errorMessage = res.error.message;
      try {
        const parsedError = JSON.parse(res.error.message) as { detail?: string; message?: string };
        errorMessage = parsedError.detail || parsedError.message || res.error.message;
      } catch {
        // If not JSON, use as-is
        errorMessage = res.error.message;
      }
      
      return { 
        isError: true, 
        message: errorMessage, 
        statusCode: res.statusCode 
      };
    }

    return {
      data: res.data,
      isError: false,
    };
  } catch (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _e: unknown
  ) {
    return { isError: true, message: "Failed to remove project member" };
  }
};