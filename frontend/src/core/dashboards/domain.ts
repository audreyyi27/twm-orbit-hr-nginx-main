export interface BucketItems {
  startDate: string;
  counts: Record<string, number>;
}
export interface CandidateStagesSummary {
  from?: string;
  to?: string;
  buckets: Record<"startDate" | string, string | number>[];
}
