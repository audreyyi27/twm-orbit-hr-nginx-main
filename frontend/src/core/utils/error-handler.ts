import { ServiceResponse } from "../types/api";

export const serviceErrorHandler = (
  e: unknown,
  statusCode?: number
): ServiceResponse<undefined> => {
  if (e instanceof Error) {
    return {
      isError: true,
      message: e.message,
      statusCode: statusCode || 500,
    };
  }
  if (statusCode == 401) {
    return {
      isError: true,
      message: "Authentication required. Please sign in to continue.",
      statusCode: statusCode || 401,
    };
  }
  if (statusCode == 403) {
    return {
      isError: true,
      message: "You do not have permission to access this resource.",
      statusCode: statusCode || 403,
    };
  }
  return {
    isError: true,
    message: "Something went wrong. If the issue persists, contact support.",
    statusCode: 500,
  };
};
