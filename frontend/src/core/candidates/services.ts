"use server";
import { revalidateTag } from "next/cache";
import { ServiceResponse, BaseMeta } from "../types/api";
import { CandidateStatusEnum } from "../utils/enums/candidates";
import { serviceErrorHandler } from "../utils/error-handler";
import {
  getCandidate,
  getCandidateCount,
  GetCandidateCountType,
  // GetCandidateJsonTemplate,
  // getCandidateJsonTemplate,
  // getCandidateResume,
  // GetCandidateResumeType,
  getCandidates,
  GetCandidatesType,
  GetCandidateType,
  // getEmailTemplate,
  // GetEmailTemplateType,
  // postCandidateCv,
  // PostCandidateCvType,
  // PostCandidateStages - REMOVED: doesn't exist
  // PostCandidateStagesType - REMOVED: doesn't exist
  // postNewCandidate,
  // postNewCandidateType,
  // postSendEmail,
  // PostSendEmailType,
  // putCandidate,
  // PutCandidatetype,
} from "./api";
import { Candidate, CandidateStages } from "./domain";
import {
  CandidateDto,
  GetCandidatesDto,
  GetEmailTemplateDto,
  PostSendEmailDto,
  PutCandidateDto,
  PostCandidateStagesDto,
  PostCandidateDto,
  // PostCandidateCvDto,
} from "./dto";

import {
  TransformCandidates,
  TransformDetailCandidate,
  TransformMetadata,
  TransfromCandidateStages,
} from "./transform";
import { EmailTemplateEnum } from "@/core/utils/enums/email-templates";

export const GetCandidatesServices = async (
  data: GetCandidatesDto,
  cb: GetCandidatesType = async (data) => await getCandidates(data)
): Promise<ServiceResponse<Candidate[] | undefined>> => {
  try {
    // Backend returns PaginatedOut: { items: CandidateDto[], meta: BaseMeta }
    const res = await cb<{ items: CandidateDto[]; meta: BaseMeta }>(data);
    if (res.error) {
      return {
        isError: true,
        message: res.error.message,
        statusCode: res.statusCode,
      };
    }
    
    // Handle both direct response and wrapped response
    const responseData = res.data;
    if (!responseData) {
      return {
        isError: true,
        message: "No data received from server",
        statusCode: res.statusCode || 500,
      };
    }
    
    // Backend returns { items: CandidateDto[] | null, meta: BaseMeta }
    // Extract items array safely
    let items: CandidateDto[] = [];
    const meta = responseData.meta;
    
    if (Array.isArray(responseData.items)) {
      items = responseData.items;
    } else if (responseData.items === null || responseData.items === undefined) {
      items = [];
    } else if (Array.isArray(responseData)) {
      // Fallback: if responseData itself is an array
      items = responseData as CandidateDto[];
    }
    
    return {
      data: TransformCandidates(items),
      meta: TransformMetadata(meta),
      message: "success get candidates",
      isError: false,
      statusCode: res.statusCode,
    };
  } catch (e: unknown) {
    console.error("GetCandidatesServices error:", e);
    return serviceErrorHandler(e);
  }
};

export const GetCandidateDetailService = async (
  id: string,
  cb: GetCandidateType = async (id) => getCandidate(id)
): Promise<
  ServiceResponse<
    { candidate: Candidate; stages: CandidateStages[] } | undefined
  >
> => {
  try {
    const res = await cb(id);
    if (res.error) {
      return {
        isError: true,
        message: res.error.message,
        statusCode: res.statusCode,
      };
    }
    // Backend returns candidate object directly in res.data (not wrapped in items)
    if (!res.data) {
      return {
        message: "Candidate detail not found",
        isError: true,
        statusCode: 400,
      };
    }
    
    // Handle inconsistent backend response format
    // Sometimes it's wrapped in items, sometimes it's direct
    let candidateData: CandidateDto;
    if ('items' in res.data && res.data.items) {
      candidateData = res.data.items as CandidateDto;
    } else {
      candidateData = res.data as unknown as CandidateDto;
    }
    
    // Transform the candidate data
    // Since we don't have candidate_stages data yet, return empty stages array
    return {
      data: {
        candidate: TransformDetailCandidate(candidateData),
        stages: [], // Empty array - candidate_stages feature not implemented yet
      },
      message: "success get candidate detail",
      isError: false,
      statusCode: res.statusCode,
    };
  } catch (e: unknown) {
    return serviceErrorHandler(e);
  }
};

// TEMPORARILY DISABLED - Backend API doesn't exist yet
/* export const PostNewCandidateService = async (
  data: PostCandidateDto,
  cb: postNewCandidateType = async (data) => postNewCandidate(data)
): Promise<ServiceResponse> => {
  try {
    const jsonObject = JSON.parse(await data.candidateData.text());
    const val: Record<string, unknown>[] = jsonObject;

    const res = await cb(val);
    if (res.error) {
      return {
        isError: true,
        message: res.error.message,
        statusCode: res.statusCode,
      };
    }
    revalidateTag("candidates");

    return {
      message: "success post new Candidate",
      isError: false,
      statusCode: res.statusCode,
    };
  } catch (e: unknown) {
    return serviceErrorHandler(e);
  }
}; */

// TEMPORARILY DISABLED - Backend API doesn't exist yet
/* export const PutCandidateService = async (
  id: string,
  data: PutCandidateDto,
  cb: PutCandidatetype = async (id, data) => putCandidate(id, data)
): Promise<ServiceResponse> => {
  try {
    const newData = Object.entries(data).map(([key, value]) => {
      if (value == undefined && value == null && value == "") {
        return [key, null];
      }
      if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)
      ) {
        return [key, new Date(value).toISOString()];
      }
      return [key, value];
    });
    const data_ = newData
      .map((item) => {
        if (!item[0]?.toString().includes("date")) return item;
        if (item[1]?.toString() == "") return;
        return item;
      })
      .filter((item) => item != undefined);
    const res = await cb(id, Object.fromEntries(data_));
    if (res.error) {
      return {
        isError: true,
        message: res.error.message,
        statusCode: res.statusCode,
      };
    }
    revalidateTag(id);
    return {
      message: "success Update Candidate",
      isError: false,
      statusCode: res.statusCode,
    };
  } catch (e: unknown) {
    return serviceErrorHandler(e);
  }
}; */

// TEMPORARILY DISABLED - Backend API doesn't exist yet
/* export const PostCandidateStagesService = async (
  data: PostCandidateStagesDto,
  cb: PostCandidateStagesType = async (data) => PostCandidateStages(data)
): Promise<ServiceResponse> => {
  try {
    const res = await cb(data);
    if (res.error) {
      return {
        isError: true,
        message: res.error.message,
        statusCode: res.statusCode,
      };
    }
    revalidateTag(data.id[0]);
    return {
      message: "success post new Candidate stage",
      isError: false,
      statusCode: res.statusCode,
    };
  } catch (e: unknown) {
    return serviceErrorHandler(e);
  }
}; */

// TEMPORARILY DISABLED - Backend API doesn't exist yet
/* export const PostBatchCandidateStagesService = async (
  data: PostCandidateStagesDto,
  cb: PostCandidateStagesType = async (data) => PostCandidateStages(data)
): Promise<ServiceResponse> => {
  try {
    const res = await cb(data);
    if (res.error) {
      return {
        isError: true,
        message: res.error.message,
        statusCode: res.statusCode,
      };
    }
    revalidateTag("candidates");
    return {
      message: "success post new Candidate stage",
      isError: false,
      statusCode: res.statusCode,
    };
  } catch (e: unknown) {
    return serviceErrorHandler(e);
  }
};

// DISABLED: Missing imports
/* export const GetEmailTemplateService = async (
  id: string,
  type: EmailTemplateEnum,
  cb: GetEmailTemplateType = async (id, type) => getEmailTemplate(id, type)
): Promise<ServiceResponse<string | undefined>> => {
  try {
    const res = await cb(id, type);
    if (res.error) {
      return {
        isError: true,
        message: res.error.message,
        statusCode: res.statusCode,
      };
    }
    return {
      data: res.data?.items?.template,
      message: "success get email template",
      isError: false,
      statusCode: res.statusCode,
    };
  } catch (e: unknown) {
    return serviceErrorHandler(e);
  }
}; */

// DISABLED: Missing imports
/* export const PostSendEmailService = async (
  id: string,
  data: PostSendEmailDto,
  cb: PostSendEmailType = async (id, data) => postSendEmail(id, data)
): Promise<ServiceResponse> => {
  try {
    const res = await cb(id, data);
    if (res.error) {
      return {
        isError: true,
        message: res.error.message,
        statusCode: res.statusCode,
      };
    }
    return {
      message: "Success send email to candidate",
      isError: false,
      statusCode: res.statusCode,
    };
  } catch (e: unknown) {
    return serviceErrorHandler(e);
  }
}; */

export const GetCandidateCountService = async (
  cb: GetCandidateCountType = async () => getCandidateCount()
): Promise<
  ServiceResponse<{ total: number } | undefined>
> => {
  try {
    const res = await cb();
    if (res.error) {
      return {
        isError: true,
        message: res.error?.message || "No statistic found",
        statusCode: res.statusCode,
      };
    }
    // Backend returns { total: number } directly, not wrapped in items
    const countData = res.data as { total: number } | undefined;
    if (!countData || countData.total === undefined) {
      return {
        isError: true,
        message: "No statistic found",
        statusCode: res.statusCode || 500,
      };
    }
    return {
      data: countData,
      message: "success get Candidate count statistic",
      isError: false,
      statusCode: res.statusCode,
    };
  } catch (e: unknown) {
    console.error("GetCandidateCountService error:", e);
    return serviceErrorHandler(e);
  }
};

// DISABLED: Missing imports
/* export const GetCandidateResumeService = async (
  id: string,
  cb: GetCandidateResumeType = async (id) => getCandidateResume(id)
): Promise<ServiceResponse<Blob | undefined>> => {
  try {
    const res = await cb(id);
    return {
      data: res,
      message: "success get Candidate count statistic",
      isError: false,
      statusCode: 200,
    };
  } catch (e: unknown) {
    return serviceErrorHandler(e);
  }
}; */

// DISABLED: Missing imports
/* export const GetCandidateJsonTemplateService = async (
  cb: GetCandidateJsonTemplate = async () => getCandidateJsonTemplate()
): Promise<ServiceResponse<Blob | undefined>> => {
  try {
    const res = await cb();
    return {
      data: res,
      message: "success get Candidate count statistic",
      isError: false,
      statusCode: 200,
    };
  } catch (e: unknown) {
    return serviceErrorHandler(e);
  }
}; */

// DISABLED: Missing imports
/* export const PostBatchCandidateCvService = async (
  data: PostCandidateCvDto,
  cb: PostCandidateCvType = async (data) => postCandidateCv(data)
): Promise<ServiceResponse> => {
  try {
    const formData = new FormData();
    formData.append("zip_file", data.candidateCv);
    const res = await cb(formData);
    if (res.error) {
      return {
        isError: true,
        message: res.error.message,
        statusCode: res.statusCode,
      };
    }
    return {
      message: "success post new Candidate",
      isError: false,
      statusCode: res.statusCode,
    };
  } catch (e: unknown) {
    return serviceErrorHandler(e);
  }
}; */

// ============================================================================
// STUB FUNCTIONS - Provide temporary implementations for disabled features
// These return "not implemented" errors so the UI doesn't crash
// ============================================================================

export const GetCandidateJsonTemplateService = async (): Promise<ServiceResponse<Blob | undefined>> => {
  return {
    isError: true,
    message: "This feature is temporarily disabled. Backend API not implemented yet.",
    statusCode: 501,
  };
};

export const GetCandidateResumeService = async (
  id: string
): Promise<ServiceResponse<Blob | undefined>> => {
  return {
    isError: true,
    message: "Resume download is temporarily disabled. Backend API not implemented yet.",
    statusCode: 501,
  };
};

export const PostBatchCandidateCvService = async (
  data: unknown
): Promise<ServiceResponse> => {
  return {
    isError: true,
    message: "Batch CV upload is temporarily disabled. Backend API not implemented yet.",
    statusCode: 501,
  };
};

export const PostBatchCandidateStagesService = async (
  data: unknown
): Promise<ServiceResponse> => {
  return {
    isError: true,
    message: "Batch stage update is temporarily disabled. Backend API not implemented yet.",
    statusCode: 501,
  };
};

export const PostNewCandidateService = async (
  data: unknown
): Promise<ServiceResponse> => {
  return {
    isError: true,
    message: "Add new candidate is temporarily disabled. Backend API not implemented yet.",
    statusCode: 501,
  };
};

export const GetEmailTemplateService = async (
  id: string,
  type: EmailTemplateEnum | GetEmailTemplateDto["type"]
): Promise<ServiceResponse<string | undefined>> => {
  return {
    isError: true,
    message: "Email template feature is temporarily disabled. Backend API not implemented yet.",
    statusCode: 501,
  };
};

export const PostSendEmailService = async (
  id: string,
  data: PostSendEmailDto
): Promise<ServiceResponse> => {
  return {
    isError: true,
    message: "Send email feature is temporarily disabled. Backend API not implemented yet.",
    statusCode: 501,
  };
};

export const PutCandidateService = async (
  id: string,
  data: PutCandidateDto
): Promise<ServiceResponse> => {
  return {
    isError: true,
    message: "Update candidate is temporarily disabled. Backend API not implemented yet.",
    statusCode: 501,
  };
};

export const PostCandidateStagesService = async (
  data: PostCandidateStagesDto
): Promise<ServiceResponse> => {
  return {
    isError: true,
    message: "Update candidate stages is temporarily disabled. Backend API not implemented yet.",
    statusCode: 501,
  };
};
