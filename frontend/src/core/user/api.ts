import { fetchMethod } from "../types/api";
import { BASE_URL } from "../utils/constant/base";
import ssrApiClient from "../utils/ssr-api";

export const postLogout = async () => {
  try {
    const res = await ssrApiClient(`${BASE_URL}/auth/logout`, fetchMethod.post);
    return res;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("Unknown error while Logout");
  }
};

export type PostLogoutType = typeof postLogout;
