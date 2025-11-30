import { ServiceResponse } from "../types/api";
import { serviceErrorHandler } from "../utils/error-handler";
import { postLogout, PostLogoutType } from "./api";

export const LogoutService = async (
  cb: PostLogoutType = async () => await postLogout()
): Promise<ServiceResponse> => {
  try {
    const res = await cb();
    if (res.error) {
      return {
        isError: true,
        message: res.error.message,
        statusCode: res.statusCode,
      };
    }
    return {
      isError: false,
      message: "Succes logout account",
      statusCode: res.statusCode,
    };
  } catch (err: unknown) {
    return serviceErrorHandler(err);
  }
};
