"use server";

import type { ApiResponse } from "@/core/types/api";
import type { 
  TeamWithDetailsDto, 
  ProjectDetailsDto, 
  ProjectDashboardDto,
  AddProjectMemberRequest,
  AvailableEmployeesResponse,
  EmployeeProjectTaskResponse,
} from "./dto";
import ssrApiClient from "@/core/utils/ssr-api";
import { BASE_URL } from "../utils/constant/base";
import { fetchMethod } from "@/core/types/api"; 

// Projects-based endpoints (main approach for project management)
export const getProjectsDashboard = async (): Promise<ApiResponse<ProjectDashboardDto>> => {
  const url = `${BASE_URL}/projects/dashboard`;
  
  return await ssrApiClient(url, fetchMethod.get, {
    cache: "no-store", // No caching for instant updates
  });
};

export const getProjectDetails = async (projectId: string): Promise<ApiResponse<ProjectDetailsDto>> => {
  const url = `${BASE_URL}/projects/${projectId}`;
  
  return await ssrApiClient(url, fetchMethod.get, {
    cache: "no-store", // Completely bypass cache for instant updates
  });
};

// UPDATE PROJECT - Add this new function
export const updateProject = async (
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
): Promise<ApiResponse<ProjectDetailsDto>> => {
  const url = `${BASE_URL}/projects/${projectId}`;
  
  return await ssrApiClient(url, fetchMethod.put, {
    body: JSON.stringify(data),
    cache: "no-store",
  });
};

// Teams-based endpoints (for team management view)
export const getTeamsWithDetails = async (): Promise<ApiResponse<TeamWithDetailsDto[]>> => {
  const url = `${BASE_URL}/teams/with-details`;
  
  return await ssrApiClient(url, fetchMethod.get, {
    next: { revalidate: 30, tags: ["teams"] },
  });
};

// Get all available employees grouped by team (no cache for dynamic data)
export const getAvailableEmployees = async (): Promise<ApiResponse<AvailableEmployeesResponse[]>> => {
  const url = `${BASE_URL}/projects/available-employees/all`;
  
  return await ssrApiClient(url, fetchMethod.get, {
    cache: "no-store",
  });
};

// Add member to project
export const addProjectMember = async (
  projectId: string,
  data: AddProjectMemberRequest
): Promise<ApiResponse<EmployeeProjectTaskResponse>> => {
  const url = `${BASE_URL}/projects/${projectId}/members`;
  
  return await ssrApiClient(url, fetchMethod.post, {
    body: JSON.stringify(data),
    cache: "no-store",
  });
};

// Remove member from project
export const removeProjectMember = async (
  projectId: string,
  taskId: string
): Promise<ApiResponse<{ message: string }>> => {
  const url = `${BASE_URL}/projects/${projectId}/members/${taskId}`;
  
  return await ssrApiClient(url, fetchMethod.del, {
    cache: "no-store",
  });
};