import { PeriodEnum } from "@/core/utils/enums/dashboard";
import {
  getCandidateStageStatistic,
  GetCandidateStageStatisticType,
} from "./api";
import {
  GetCandidateStagesSummaryDto,
  GetCandidateStagesSummaryResponseDto,
} from "./dto";
import { TransformCandidateStageStatistic } from "./transform";
import { ServiceResponse } from "../types/api";
import { CandidateStagesSummary } from "./domain";
import { serviceErrorHandler } from "../utils/error-handler";

export const GetCandidateStageStatisticServices = async (
  data: GetCandidateStagesSummaryDto,
  cb: GetCandidateStageStatisticType = async (data) =>
    await getCandidateStageStatistic(data)
): Promise<ServiceResponse<CandidateStagesSummary | undefined>> => {
  try {
    const payload: GetCandidateStagesSummaryDto = {
      period: data.from && data.to ? PeriodEnum.custom : data.period,
      from: data.from,
      to: data.to,
    };
    const res = await cb<GetCandidateStagesSummaryResponseDto>(payload);
    if (res.error) {
      return {
        isError: true,
        message: res.error.message,
        statusCode: res.statusCode,
      };
    }
    if (!res.data?.items) {
      return {
        message: "Data not found",
        isError: true,
        statusCode: res.statusCode,
      };
    }
    return {
      data: TransformCandidateStageStatistic(res.data?.items),
      message: "success get candidates",
      isError: false,
      statusCode: res.statusCode,
    };
  } catch (e: unknown) {
    return serviceErrorHandler(e);
  }
};
