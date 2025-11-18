"use server";
import { ApiError, ApiResponse, FetchhMethod } from "@/core/types/api";
import { cookies, headers } from "next/headers";

export default async function ssrApiClient<T>(
  url: string,
  fetchMethod: FetchhMethod,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  
  // Debug: Log token status (without exposing the actual token)
  if (!token) {
    console.log(`[ssr-api] No access_token cookie found for request: ${url}`);
  } else {
    console.log(`[ssr-api] Token found (length: ${token.length}) for request: ${url}`);
  }
  
  // Convert relative URLs to absolute URLs for server-side fetch
  let fetchUrl = url;
  if (url.startsWith('/') && !url.startsWith('//')) {
    // Check if this is a backend API route (not Next.js auth routes)
    const isBackendApiRoute = url.startsWith('/api/') && !url.startsWith('/api/auth/');
    
    if (isBackendApiRoute) {
      // Route to backend server
      // Check for explicit backend URL, or use NEXT_PUBLIC_API_BASE if it's an absolute URL
      let backendUrl = process.env.BACKEND_URL;
      if (!backendUrl) {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE;
        // If NEXT_PUBLIC_API_BASE is an absolute URL, use it; otherwise default to localhost:8000
        backendUrl = (apiBase && (apiBase.startsWith('http://') || apiBase.startsWith('https://'))) 
          ? apiBase 
          : 'http://localhost:8000';
      }
      // Remove /api prefix and route to backend
      const backendPath = url.replace(/^\/api/, '');
      fetchUrl = `${backendUrl}${backendPath}`;
      console.log(`[ssr-api] Backend route: ${url} -> ${fetchUrl}`);
    } else {
      // Route to frontend (Next.js server)
      const headersList = await headers();
      const host = headersList.get('host') || 'localhost:3000';
      const protocol = headersList.get('x-forwarded-proto') || 'http';
      fetchUrl = `${protocol}://${host}${url}`;
      console.log(`[ssr-api] Frontend route: ${url} -> ${fetchUrl}`);
    }
  } else {
    console.log(`[ssr-api] Absolute URL: ${fetchUrl}`);
  }
  
  try {
    const finalHeaders = new Headers(options?.headers as HeadersInit);
    finalHeaders.set("Content-Type", "application/json");
    
    // Only add Authorization header if we have a token
    if (token) {
      finalHeaders.set("Authorization", `Bearer ${token}`);
    }

    if (options?.body instanceof FormData) {
      finalHeaders.delete("Content-Type");
    }
    const res = await fetch(fetchUrl, {
      method: fetchMethod,
      ...options,
      headers: finalHeaders,
    });
    
    // Log response for debugging
    console.log(`[ssr-api] Response: ${res.status} ${res.statusText} for ${fetchUrl}`);
    
    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage = errorText || "Unexpected error";
      
      // Try to parse as JSON for better error messages
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorJson.message || errorText;
      } catch {
        // Not JSON, use text as-is
      }
      
      console.error(`[ssr-api] Error ${res.status}: ${errorMessage} for ${fetchUrl}`);
      
      return {
        error: {
          status: res.status,
          name: res.statusText,
          message: errorMessage,
          details: {},
        },
        statusCode: res.status,
      };
    }
    if (res.status == 204) {
      return {
        statusCode: res.status,
      };
    }
    const data = await res.json();
    if (data == null && res.status == 200) {
      return {
        statusCode: res.status,
      };
    }
    if (data.error) {
      return {
        error: data.error as ApiError,
        statusCode: res.status,
      };
    }

    return {
      data: data,
      error: undefined,
      statusCode: res.status,
    };
  } catch (err) {
    const error = err as Error;
    return {
      error: {
        status: 500,
        details: {
          cause: error.cause,
        },
        message: error.message,
        name: error.name,
      },
      statusCode: 500,
    };
  }
}

export async function ssrFileClient(
  url: string,
  fetchMethod: FetchhMethod,
  options?: RequestInit
): Promise<Blob> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  
  // Convert relative URLs to absolute URLs for server-side fetch
  let fetchUrl = url;
  if (url.startsWith('/') && !url.startsWith('//')) {
    // Check if this is a backend API route (not Next.js auth routes)
    const isBackendApiRoute = url.startsWith('/api/') && !url.startsWith('/api/auth/');
    
    if (isBackendApiRoute) {
      // Route to backend server
      // Check for explicit backend URL, or use NEXT_PUBLIC_API_BASE if it's an absolute URL
      let backendUrl = process.env.BACKEND_URL;
      if (!backendUrl) {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE;
        // If NEXT_PUBLIC_API_BASE is an absolute URL, use it; otherwise default to localhost:8000
        backendUrl = (apiBase && (apiBase.startsWith('http://') || apiBase.startsWith('https://'))) 
          ? apiBase 
          : 'http://localhost:8000';
      }
      // Remove /api prefix and route to backend
      const backendPath = url.replace(/^\/api/, '');
      fetchUrl = `${backendUrl}${backendPath}`;
    } else {
      // Route to frontend (Next.js server)
      const headersList = await headers();
      const host = headersList.get('host') || 'localhost:3000';
      const protocol = headersList.get('x-forwarded-proto') || 'http';
      fetchUrl = `${protocol}://${host}${url}`;
    }
  }

  const res = await fetch(fetchUrl, {
    method: fetchMethod,
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    if (res.status == 500) {
      throw new Error("Internal Server error");
    }
    const data = await res.json();

    throw new Error(`File fetch failed: ${res.status} ${data.detail}`);
  }

  return await res.blob();
}
