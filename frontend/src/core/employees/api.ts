// Simple API calls to backend

import type { ApiResponse } from "@/core/types/api";
import type { EmployeeDto, GetEmployeesDto, TeamProjectsDto, EmployeeProjectDto } from "./dto";
import ssrApiClient from "@/core/utils/ssr-api";
import { BASE_URL } from "../utils/constant/base";
import { fetchMethod } from "@/core/types/api";

// List employees
export const getEmployees = async (params: GetEmployeesDto): Promise<ApiResponse<EmployeeDto[]>> => {
  const queryParams = new URLSearchParams({
    page: params.page,
    per_page: params.perPage,
  });
  
  if (params.search) queryParams.append("search", params.search);
  
  const url = `${BASE_URL}/employees?${queryParams.toString()}`;
  
  return await ssrApiClient(url, fetchMethod.get, {
    next: { revalidate: 15, tags: ["employees"] },
  });
};

// Get single employee
export const getEmployee = async (id: string): Promise<ApiResponse<EmployeeDto>> => {
  const url = `${BASE_URL}/employees/${id}`;
  
  return await ssrApiClient(url, fetchMethod.get, {
    next: { revalidate: 15, tags: ["employees", id] },
  });
};

// Get employee with all their projects
export const getEmployeeWithProjects = async (id: string): Promise<ApiResponse<EmployeeProjectDto>> => {
  const url = `${BASE_URL}/employees/${id}/projects`;
  
  return await ssrApiClient(url, fetchMethod.get, {
    // Always fetch fresh project data for an employee
    cache: "no-store",
  });
};

// Get team with all members and their projects
export const getTeamProjects = async (teamName: string): Promise<ApiResponse<TeamProjectsDto>> => {
  const url = `${BASE_URL}/employees/teams/${encodeURIComponent(teamName)}/projects`;
  
  return await ssrApiClient(url, fetchMethod.get, {
    // Always fetch fresh team projects; avoid stale cached responses
    cache: "no-store",
  });
};