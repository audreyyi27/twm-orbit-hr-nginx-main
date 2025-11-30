import ssrApiClient from "@/core/utils/ssr-api";
import { GetCandidateStagesSummaryDto } from "./dto";
import { ApiResponse, fetchMethod } from "@/core/types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE;

export const getCandidateStageStatistic = async <T>(
  data: GetCandidateStagesSummaryDto
): Promise<ApiResponse<T>> => {
  const params = new URLSearchParams({
    period: data.period,
  });
  if (data.from) {
    params.append("from", data.from);
  }
  if (data.to) {
    params.append("to", data.to);
  }
  const url = `${BASE_URL}/dashboard/candidate-stages?${params.toString()}`;
  try {
    const res = await ssrApiClient<T>(url, fetchMethod.get);
    return res;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("Unknown error while fetching candidate stages statistic");
  }
};

export type GetCandidateStageStatisticType = typeof getCandidateStageStatistic;
