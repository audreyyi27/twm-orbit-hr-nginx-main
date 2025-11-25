import { Metadata } from "@/core/types/base";

export interface BasePaginationRequest {
  page: number;
  per_page: number;
  search: string;
}
export interface BaseMeta {
  per_page: number;
  page: number;
  total_pages: number;
}

export const fetchMethod = {
  get: "GET",
  post: "POST",
  put: "PUT",
  del: "DELETE",
  patch: "PATCH",
} as const;

export type FetchhMethod = (typeof fetchMethod)[keyof typeof fetchMethod];

export interface ServiceResponse<T = void> {
  statusCode: number;
  data?: T;
  meta?: Metadata;
  isError: boolean;
  message: string;
}

export interface ApiError {
  status: number;
  name: string;
  message: string;
  details: Record<string, unknown>;
}
export interface ApiResponse<T> {
  data?: {
    items: T | null;
    meta: BaseMeta;
  };
  error?: ApiError;
  statusCode: number;
}
