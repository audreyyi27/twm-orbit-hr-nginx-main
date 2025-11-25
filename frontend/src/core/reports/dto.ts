import { CandidateStatusEnum } from "../utils/enums/candidates";

export interface PostRecruitmentReportDto {
  candidate_status: CandidateStatusEnum;
  start_date: string;
  end_date: string;
  file_type: "excel" | "pdf";
}
