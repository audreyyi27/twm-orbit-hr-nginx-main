import { fetchMethod } from "../types/api";
import { BASE_URL } from "../utils/constant/base";
import { CandidateStatusEnum } from "../utils/enums/candidates";
import { ssrFileClient } from "../utils/ssr-api";
import { PostRecruitmentReportDto } from "./dto";

export const postRecruitmentReport = async (data: PostRecruitmentReportDto) => {
  try {
    const params = new URLSearchParams({
      start_date: data.start_date,
      end_date: data.end_date,
    });
    if (data.candidate_status !== CandidateStatusEnum.all) {
      params.set("candidate_status", data.candidate_status);
    }
    const url = `${BASE_URL}/reports?${params.toString()}`;
    const res = await ssrFileClient(url, fetchMethod.get);
    return res;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("Unknown error while Post recruitment report");
  }
};

export type PostRecruitmentReportType = typeof postRecruitmentReport;
