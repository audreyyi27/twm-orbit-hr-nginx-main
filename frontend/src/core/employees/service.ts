// Simple Service Layer - use DTO directly!

import type { EmployeeDto, GetEmployeesDto } from "./dto";
import { getEmployees, getEmployee } from "./api";
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

