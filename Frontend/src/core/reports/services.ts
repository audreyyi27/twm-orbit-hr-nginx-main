import { ServiceResponse } from "../types/api";
import { serviceErrorHandler } from "../utils/error-handler";
import { postRecruitmentReport, PostRecruitmentReportType } from "./api";
import { PostRecruitmentReportDto } from "./dto";

export const PostRecruitmentReportService = async (
  data: PostRecruitmentReportDto,
  cb: PostRecruitmentReportType = async (data) => postRecruitmentReport(data)
): Promise<ServiceResponse<Blob | undefined>> => {
  try {
    const res = await cb(data);
    return {
      data: res,
      message: "success post new Candidate report",
      isError: false,
      statusCode: 200,
    };
  } catch (e: unknown) {
    return serviceErrorHandler(e);
  }
};
