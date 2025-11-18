"use server";
import { ServiceResponse } from "../types/api";
import { serviceErrorHandler } from "../utils/error-handler";
import {
  getCandidate,
  getCandidateCount,
  GetCandidateCountType,
  getCandidates,
  GetCandidatesType,
  GetCandidateType,
} from "./api";
import { Candidate, CandidateStages } from "./domain";
import {
  CandidateDto,
  GetCandidatesDto,
} from "./dto";

import {
  TransformCandidates,
  TransformDetailCandidate,
  TransformMetadata,
} from "./transform";

export const GetCandidatesServices = async (
  data: GetCandidatesDto,
  cb: GetCandidatesType = async (data) => await getCandidates(data)
): Promise<ServiceResponse<Candidate[] | undefined>> => {
  try {
    // Backend returns PaginatedOut: { items: CandidateDto[], meta: Metadata }
    const res = await cb<{ items: CandidateDto[]; meta: Record<string, unknown> }>(data);
    if (res.error) {
      return {
        isError: true,
        message: res.error.message,
        statusCode: res.statusCode,
      };
    }
    
    // Handle both direct response and wrapped response
    const responseData = res.data as { items: CandidateDto[]; meta: Record<string, unknown> } | undefined;
    if (!responseData) {
      return {
        isError: true,
        message: "No data received from server",
        statusCode: res.statusCode || 500,
      };
    }
    
    // Backend returns { items: [...], meta: {...} }
    const items = responseData.items || (Array.isArray(responseData) ? responseData : []);
    const meta = responseData.meta as Record<string, unknown> | undefined;
    
    return {
      data: TransformCandidates(items),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      meta: TransformMetadata(meta as any),
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
    const resData = res.data as { items?: CandidateDto } | CandidateDto | null;
    if (resData && 'items' in resData && resData.items) {
      candidateData = resData.items as CandidateDto;
    } else {
      candidateData = resData as CandidateDto;
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
export const GetCandidateJsonTemplateService = async (): Promise<ServiceResponse<Blob | undefined>> => {
  return {
    isError: true,
    message: "This feature is temporarily disabled. Backend API not implemented yet.",
    statusCode: 501,
  };
};

export const GetCandidateResumeService = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _id: string
): Promise<ServiceResponse<Blob | undefined>> => {
  return {
    isError: true,
    message: "Resume download is temporarily disabled. Backend API not implemented yet.",
    statusCode: 501,
  };
};

export const PostBatchCandidateCvService = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _data: Record<string, unknown>
): Promise<ServiceResponse> => {
  return {
    isError: true,
    message: "Batch CV upload is temporarily disabled. Backend API not implemented yet.",
    statusCode: 501,
  };
};

export const PostBatchCandidateStagesService = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _data: Record<string, unknown>
): Promise<ServiceResponse> => {
  return {
    isError: true,
    message: "Batch stage update is temporarily disabled. Backend API not implemented yet.",
    statusCode: 501,
  };
};

export const PostNewCandidateService = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _data: Record<string, unknown>
): Promise<ServiceResponse> => {
  return {
    isError: true,
    message: "Add new candidate is temporarily disabled. Backend API not implemented yet.",
    statusCode: 501,
  };
};

export const GetEmailTemplateService = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _id: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _type: Record<string, unknown>
): Promise<ServiceResponse<string | undefined>> => {
  return {
    isError: true,
    message: "Email template feature is temporarily disabled. Backend API not implemented yet.",
    statusCode: 501,
  };
};

export const PostSendEmailService = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _id: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _data: Record<string, unknown>
): Promise<ServiceResponse> => {
  return {
    isError: true,
    message: "Send email feature is temporarily disabled. Backend API not implemented yet.",
    statusCode: 501,
  };
};

export const PutCandidateService = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _id: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _data: Record<string, unknown>
): Promise<ServiceResponse> => {
  return {
    isError: true,
    message: "Update candidate is temporarily disabled. Backend API not implemented yet.",
    statusCode: 501,
  };
};

export const PostCandidateStagesService = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _data: Record<string, unknown>
): Promise<ServiceResponse> => {
  return {
    isError: true,
    message: "Update candidate stages is temporarily disabled. Backend API not implemented yet.",
    statusCode: 501,
  };
};
