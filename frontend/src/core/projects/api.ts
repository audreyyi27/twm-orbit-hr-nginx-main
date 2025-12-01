import type { ApiResponse } from "@/core/types/api";
import type { 
  TeamWithDetailsDto, 
  ProjectDetailsDto, 
  ProjectDashboardDto,
  AddProjectMemberRequest,
  AvailableEmployeesResponse,
  EmployeeProjectTaskResponse,
} from "./dto";
import type { AttendanceDto, AttendanceLeaveDto, AttendanceOvertimeDto } from "../employees/dto";
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

// ==================== ATTENDANCE FUNCTIONS FOR PROJECT MEMBERS ====================
// These functions get attendance data for project members by their nt_account
// Similar to employees/attendance_api.ts but organized under projects API
// Works for both client and server components

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

// Get attendance records for a project member by nt_account
// Optional date parameter in YYYY-MM-DD format for filtering (e.g., today's attendance)
export const getProjectMemberAttendance = async (
  ntAccount: string,
  date?: string
): Promise<ApiResponse<AttendanceDto[]>> => {
  // Check if we're in a client component
  if (typeof window !== "undefined") {
    const dateParam = date ? `?date=${encodeURIComponent(date)}` : '';
    const path = `/attendance/employee/${encodeURIComponent(ntAccount)}/attendance${dateParam}`;
    return await clientApiFetch<AttendanceDto[]>(path);
  }
  
  // Server-side version
  const dateParam = date ? `?date=${encodeURIComponent(date)}` : '';
  const url = `${BASE_URL}/attendance/employee/${encodeURIComponent(ntAccount)}/attendance${dateParam}`;
  return await ssrApiClient(url, fetchMethod.get, {
    cache: "no-store",
  });
};

// Get leave records for a project member by nt_account
export const getProjectMemberLeave = async (
  ntAccount: string
): Promise<ApiResponse<AttendanceLeaveDto[]>> => {
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

// Get overtime records for a project member by nt_account
export const getProjectMemberOvertime = async (
  ntAccount: string
): Promise<ApiResponse<AttendanceOvertimeDto[]>> => {
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