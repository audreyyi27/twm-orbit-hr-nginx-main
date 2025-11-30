import { CandidateStagesSummary } from "./domain";
import { GetCandidateStagesSummaryResponseDto } from "./dto";

export function TransformCandidateStageStatistic(
  data: GetCandidateStagesSummaryResponseDto
): CandidateStagesSummary {
  return {
    buckets: data.buckets.map((i) => ({
      startDate: i.bucket_start,
      ...i.counts,
    })),
    from: data.from_,
    to: data.to,
  };
}
