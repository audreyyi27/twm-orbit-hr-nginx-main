import type { ApiResponse } from "@/core/types/api";
import type { AttendanceDto, AttendanceLeaveDto, AttendanceOvertimeDto } from "./dto";
import ssrApiClient from "@/core/utils/ssr-api";
import { BASE_URL } from "../utils/constant/base";
import { fetchMethod } from "@/core/types/api";

// Client-side API helper (for use in client components)
async function clientApiFetch<T>(path: string): Promise<ApiResponse<T>> {
  try {
    // Get token from API route
    const authRes = await fetch("/api/auth/get-token", {
      credentials: "include",
    });

    if (!authRes.ok) {
      throw new Error("Failed to get authentication token");
    }

    const { token } = await authRes.json();
    if (!token) {
      throw new Error("No authentication token available");
    }

    // Get backend URL
    const backendUrl = BASE_URL || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
    const url = `${backendUrl}${path}`;

    // Call backend directly
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!res.ok) {
      const errorText = await res.text();
      return {
        error: {
          status: res.status,
          name: res.statusText,
          message: errorText || "Request failed",
          details: {},
        },
        statusCode: res.status,
      };
    }

    const data = await res.json();
    
    // Backend returns array directly, wrap it in the expected format
    return {
      data: { items: (Array.isArray(data) ? data : []) as T, meta: { page: 1, per_page: 100, total_pages: 1 } },
      statusCode: res.status,
    };
  } catch (error) {
    return {
      error: {
        status: 500,
        name: "Error",
        message: error instanceof Error ? error.message : "An error occurred",
        details: {},
      },
      statusCode: 500,
    };
  }
}

// Get all attendance records for an employee by nt_account
export const getEmployeeAttendance = async (ntAccount: string): Promise<ApiResponse<AttendanceDto[]>> => {
  // Check if we're in a client component
  if (typeof window !== "undefined") {
    const path = `/attendance/employee/${encodeURIComponent(ntAccount)}/attendance`;
    return await clientApiFetch<AttendanceDto[]>(path);
  }
  
  // Server-side version
  const url = `${BASE_URL}/attendance/employee/${encodeURIComponent(ntAccount)}/attendance`;
  return await ssrApiClient(url, fetchMethod.get, {
    cache: "no-store",
  });
};

// Get all leave records for an employee by nt_account
export const getEmployeeLeave = async (ntAccount: string): Promise<ApiResponse<AttendanceLeaveDto[]>> => {
  // Check if we're in a client component
  if (typeof window !== "undefined") {
    const path = `/attendance/employee/${encodeURIComponent(ntAccount)}/leave`;
    return await clientApiFetch<AttendanceLeaveDto[]>(path);
  }
  
  // Server-side version
  const url = `${BASE_URL}/attendance/employee/${encodeURIComponent(ntAccount)}/leave`;
  return await ssrApiClient(url, fetchMethod.get, {
    cache: "no-store",
  });
};

// Get all overtime records for an employee by nt_account
export const getEmployeeOvertime = async (ntAccount: string): Promise<ApiResponse<AttendanceOvertimeDto[]>> => {
  // Check if we're in a client component
  if (typeof window !== "undefined") {
    const path = `/attendance/employee/${encodeURIComponent(ntAccount)}/overtime`;
    return await clientApiFetch<AttendanceOvertimeDto[]>(path);
  }
  
  // Server-side version
  const url = `${BASE_URL}/attendance/employee/${encodeURIComponent(ntAccount)}/overtime`;
  return await ssrApiClient(url, fetchMethod.get, {
    cache: "no-store",
  });
};