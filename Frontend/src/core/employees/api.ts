// Simple API calls to backend

import type { ApiResponse } from "@/core/types/api";
import type { EmployeeDto, GetEmployeesDto } from "./dto";
import ssrApiClient from "@/core/utils/ssr-api";
import { BASE_URL } from "../utils/constant/base";
import { fetchMethod } from "@/core/types/api";

// List employees
export const getEmployees = async (params: GetEmployeesDto): Promise<ApiResponse<{ items: EmployeeDto[]; meta: Record<string, unknown> }>> => {
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

