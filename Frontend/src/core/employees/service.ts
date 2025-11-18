// Simple Service Layer - use DTO directly!

import type { EmployeeDto, GetEmployeesDto } from "./dto";
import { getEmployees, getEmployee } from "./api";

export interface ServiceResponse<T> {
  data?: T;
  meta?: Record<string, unknown>;
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

    const data = Array.isArray(res.data) ? res.data : (res.data?.items || []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta = (res.data as any)?.meta;
    
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: data as any,
      meta,
      isError: false,
    };
  } catch (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _e: unknown
  ) {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const employee = (res.data as any)?.items || res.data;
    
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: employee as any,
      isError: false,
    };
  } catch (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _e: unknown
  ) {
    return { isError: true, message: "Failed to fetch employee" };
  }
};

