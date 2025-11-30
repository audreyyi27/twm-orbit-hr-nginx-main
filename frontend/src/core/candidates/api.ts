import {
  CandidateDto,
  CandidateStagesDto,
  GetCandidatesDto,
  PostCandidateStagesDto,
  PostSendEmailDto,
  PutCandidateDto,
} from "./dto";
import { apiFetch } from "@/lib/api";
import ssrApiClient, { ssrFileClient } from "@/core/utils/ssr-api";
import { ApiResponse, fetchMethod } from "@/core/types/api";
import { EmailTemplateEnum } from "@/core/utils/enums/email-templates";
import { CandidateStatusEnum } from "../utils/enums/candidates";
import { BASE_URL } from "../utils/constant/base";


// ================== from get_candidates.py ==========================



// 1. List candidates get_candidates function 
// Backend: get_candidates.py → @router.get("")
export const getCandidates = async <T>(
  data: GetCandidatesDto
): Promise<ApiResponse<T>> => {
  const params = new URLSearchParams({
    page: data.page,
    per_page: data.perPage,
  });
  if (data.search) params.append("search", data.search);
  if (data.sortBy) params.append("sort_order", data.sortBy);
  if (data.startDate) params.append("start_date", data.startDate);
  if (data.endDate) params.append("end_date", data.endDate);

  const url = `${BASE_URL}/candidates?${params.toString()}`;
  console.log(url);
  try {
    const res = await ssrApiClient<T>(url, fetchMethod.get, {
      next: {
        revalidate: 15,
        tags: ["candidates"],
      },
    });
    return res;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("Unknown error while fetching candidates");
  }
};

export type GetCandidatesType = typeof getCandidates;



// 2. Get single candidate by ID
// Backend: get_candidates.py → @router.get("/{candidate_id}")
export const getCandidate = async (
  id: string
): Promise<ApiResponse<CandidateDto>> => {
  try {
    const res = await ssrApiClient<CandidateDto>(
      `${BASE_URL}/candidates/${id}`, 
      fetchMethod.get, 
      {
        next: { revalidate: 15, tags: [id] },
      }
    );
    return res;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("Unknown error while fetching candidate");
  }
};

export type GetCandidateType = typeof getCandidate;



// 3. Count total candidates
// Backend: get_candidates.py → @router.get("/stats/count")
export const getCandidateCount = async (): Promise<
  ApiResponse<{ total: number }>
> => {
  try {
    const res = await ssrApiClient<{ total: number }>(
      `${BASE_URL}/candidates/stats/count`,
      fetchMethod.get,
      {
        next: { revalidate: 60 },
      }
    );
    // Do not throw on error; propagate for higher-level redirect handling
    return res;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("Unknown error while counting candidates");
  }
};

export type GetCandidateCountType = typeof getCandidateCount;