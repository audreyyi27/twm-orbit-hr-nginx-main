"use server";
import { ApiError, ApiResponse, FetchhMethod } from "@/core/types/api";
import { cookies } from "next/headers";

const APP_ORIGIN =
  process.env.APP_ORIGIN ||
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const absoluteUrl = (url: string): string => {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  const normalizedBase = APP_ORIGIN.replace(/\/$/, "");
  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${normalizedBase}${normalizedPath}`;
};

export default async function ssrApiClient<T>(
  url: string,
  fetchMethod: FetchhMethod,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  try {
    const finalHeaders: HeadersInit = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",

      ...(options?.headers || {}),
    };

    if (options?.body instanceof FormData) {
      if ("Content-Type" in finalHeaders) {
        delete (finalHeaders as Record<string, string>)["Content-Type"];
      }
    }
    const targetUrl = absoluteUrl(url);
    
    // Merge options properly - avoid conflicting cache settings
    const fetchOptions: RequestInit = {
      method: fetchMethod,
      ...options,
      headers: finalHeaders,
    };
    
    // Only set cache if not already specified in options
    if (!options?.cache && !options?.next) {
      fetchOptions.cache = 'no-store';
    }
    
    const res = await fetch(targetUrl, fetchOptions);
    if (!res.ok) {
      return {
        error: {
          status: res.status,
          name: res.statusText,
          message: (await res.text()) || "Unexpected error",
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

  const targetUrl = absoluteUrl(url);
  const res = await fetch(targetUrl, {
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
