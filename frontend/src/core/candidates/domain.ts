import { CandidateStatusEnum } from "../utils/enums/candidates";

export interface CandidateProfile {
  email: string;
  name?: string;
  whatsapp?: string;
  totalExperience?: number;
  highestDegree?: string;
  workExperience?: string;
  domicile?: string;
  remoteWorkExperience?: string;
  teamWorkExperience?: string;
  aiMlExperience?: string;
  salaryExpectation?: number;
  resumeUrl?: string;
}
export interface CandidateDeveloperExperience {
  operatingSystems?: string;
  lastProjectDescription?: string;
  programingLanguageExperience: {
    language: string;
    experience: string;
  };
  frameworksLibraries?: string;
  serverExperience?: string;
  osSkills?: string;
  developmentMethodology?: string;
  learningNewTechReaction?: string;
  environmentChangeReadiness?: string;
  toolsIdeUsed?: string;
  gitExperience?: string;
  learningSources?: string;
  virtualizationExperience?: string;
  complexProjectExperience?: string;
  aiToolsUsage?: string;
  learningNewSkills?: string;
}
export interface CandidateInterviewProcess {
  interviewDate?: string; // ISO timestamp
  teamLeadInterview?: string;
  interviewPanel?: string;
  finalInterviewDate?: string;
  teamLeadInterviewDate?: string;
  interviewStatus?: string;
  meetingLink?: string;
  panel?: string;
  hostPassword?: string;
  salaryNego?: number;
}
export interface CandidateSurvey {
  remoteWorkInterest?: string;
  companyInterestReason?: string;
  prdForeignLanguageApproach?: string;
  multipleDeadlinesStrategy?: string;
  submittedFormResponses?: string;
  formResponsesLink?: string;
}
export interface CandidateCoding {
  codingTestDate?: string;
  codingTest?: string;
  codingScore?: number;
  testLanguageConfirmation?: string;
}
export interface Candidate {
  id: string;
  profile: CandidateProfile;
  isSenior?: boolean;
  dateStandardized?: string; // ISO timestamp
  formTimestamp?: string; // ISO timestamp
  developerExperience: CandidateDeveloperExperience;
  interview: CandidateInterviewProcess;
  processedStatus: CandidateStatusEnum;
  survey: CandidateSurvey;
  codingTest: CandidateCoding;
  finalDecision?: string;
  attendStatus?: string;
  criterias: [string, string];
  appliedAt?: string;
  // Raw database fields - all columns from your DB (matching actual database schema)
  rawData?: {
    uuid: string;
    name?: string;
    age?: number;
    gender?: string;
    location?: string;
    experience_month?: number;
    highest_degree?: string;
    job_preference?: string;
    location_preference?: string;
    instagram?: string;
    linkedin?: string;
    github?: string;
    codepen?: string;
    facebook?: string;
    twitter?: string;
    certificate?: string;
    volunteer_organization_experience?: string;
    awards_from_preference?: string;
    expected_salary?: string;
    about_me?: string;
    skills?: string;
    education?: string;
    awards?: string;
    organization?: string;
    whatsapp?: string;
    email: string;
    cv_file?: string;
    date_scraped?: string;
    applied_as?: string;
    candidate_status?: string;
    website?: string;
  };
}

export interface CandidateStages {
  id: string;
  candidateId: string;
  stage: CandidateStatusEnum;
  stageKey?: string;
  stageOrder: number;
  enteredAt?: string;
  exitedAt?: string;
  durationSeconds?: number;
  hrPrivateNotes?: string;
  sendEmailOnReject?: boolean;
  emailSentAt?: string;
  createdBy?: string;
}

/**
 * To format candidate status in order
 * @param status
 * @returns
 */
export const stagesOrderFormatter = (status: CandidateStatusEnum) => {
  switch (status) {
    case CandidateStatusEnum.applied:
      return 1;
    case CandidateStatusEnum.resume_scraped:
      return 2;
    case CandidateStatusEnum.screened:
      return 3;
    case CandidateStatusEnum.survey:
      return 4;
    case CandidateStatusEnum.coding_test:
      return 5;
    case CandidateStatusEnum.interview_lead:
      return 6;
    case CandidateStatusEnum.interview_gm:
      return 7;
    case CandidateStatusEnum.offer:
      return 8;
    case CandidateStatusEnum.hired:
      return 9;
    case CandidateStatusEnum.rejected:
      return -1;
    default:
      return 0;
  }
};

export const reorderCandidateStage = (data: CandidateStages[]) =>
  data.sort((a, b) => a.stageOrder - b.stageOrder);

export const getNextCandidateStatus = (
  status: CandidateStatusEnum,
  isSenior?: boolean
): CandidateStatusEnum | undefined => {
  switch (status) {
    case CandidateStatusEnum.applied:
      return CandidateStatusEnum.resume_scraped;
    case CandidateStatusEnum.resume_scraped:
      return CandidateStatusEnum.screened;
    case CandidateStatusEnum.screened:
      return CandidateStatusEnum.survey;
    case CandidateStatusEnum.survey:
      return CandidateStatusEnum.coding_test;
    case CandidateStatusEnum.coding_test:
      if (isSenior) return CandidateStatusEnum.interview_lead;
      return CandidateStatusEnum.interview_gm;
    case CandidateStatusEnum.interview_lead:
      return CandidateStatusEnum.interview_gm;
    case CandidateStatusEnum.interview_gm:
      return CandidateStatusEnum.offer;
    case CandidateStatusEnum.offer:
      return CandidateStatusEnum.hired;
    case CandidateStatusEnum.hired:
      return undefined;
    case CandidateStatusEnum.rejected:
      return undefined;
    default:
      return undefined;
  }
};

export const RECRUITMENT_FLOW_ORDERS = Object.values(CandidateStatusEnum).map(
  (item) => ({
    title: item.replaceAll("_", " "),
    order: stagesOrderFormatter(item),
    value: item,
  })
);

export const checkSeniorityLevel = (val: boolean) => Boolean(val);
