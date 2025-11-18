import { PeriodEnum } from "@/core/utils/enums/dashboard";

export interface GetCandidateStagesSummaryDto {
  period: PeriodEnum;
  from?: string;
  to?: string;
}

export interface BucketItemsDto {
  bucket_start: string;
  counts: Record<string, number>;
}
export interface GetCandidateStagesSummaryResponseDto {
  period: PeriodEnum;
  from_?: string;
  to?: string;
  buckets: BucketItemsDto[];
}
