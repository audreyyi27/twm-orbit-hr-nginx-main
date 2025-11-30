import {
  Candidate,
  CandidateStages,
  checkSeniorityLevel,
  stagesOrderFormatter,
} from "./domain";
import { CandidateDto, CandidateStagesDto } from "./dto";
import { Metadata } from "../types/base";
import { MetadataDto } from "../types/dto";
import { CandidateStatusEnum } from "../utils/enums/candidates";

const SENIOR_YEAR_EXPERIENCE = 5;

export function TransformCandidates(data: CandidateDto[]): Candidate[] {
  if (!data || !Array.isArray(data)) {
    console.warn("TransformCandidates: data is not an array", data);
    return [];
  }
  try {
    return data.map((item) => TransformDetailCandidate(item));
  } catch (error) {
    console.error("TransformCandidates error:", error, data);
    return [];
  }
}

export function TransformDetailCandidate(data: CandidateDto): Candidate {
  if (!data || !data.uuid) {
    console.error("TransformDetailCandidate: invalid data", data);
    throw new Error("Invalid candidate data: missing uuid");
  }
  
  // Ensure uuid is a string
  const candidateId = typeof data.uuid === 'string' ? data.uuid : String(data.uuid);
  
  return {
    codingTest: {
      codingScore: 0,
      codingTest: "",
      codingTestDate: "",
      testLanguageConfirmation: "",
    },
    criterias: ["", ""],
    developerExperience: {
      programingLanguageExperience: {
        language: "",
        experience: "",
      },
      aiToolsUsage: "",
      complexProjectExperience: "",
      developmentMethodology: data.development_methodology || "",
      environmentChangeReadiness: data.environment_change_readiness || "",
      frameworksLibraries: "",
      gitExperience: "",
      lastProjectDescription: "",
      learningNewSkills: "",
      learningNewTechReaction: data.learning_new_tech_reaction || "",
      learningSources: "",
      operatingSystems: "",
      osSkills: data.os_skills || "",
      serverExperience: "",
      toolsIdeUsed: "",
      virtualizationExperience: "",
    },
    interview: {
      finalInterviewDate: "",
      hostPassword: "",
      interviewDate: "",
      interviewPanel: "",
      interviewStatus: "",
      meetingLink: "",
      panel: "",
      salaryNego: 0,
      teamLeadInterview: "",
      teamLeadInterviewDate: "",
    },
    profile: {
      email: data.email || "",
      aiMlExperience: data.ai_ml_experience || "",
      domicile: data.location || "",  // English: location
      highestDegree: data.highest_degree || "",  // English: highest_degree
      name: data.name || "",
      remoteWorkExperience: data.remote_work_experience || "",
      salaryExpectation: parseInt(data.expected_salary || "0") || 0,  // English: expected_salary
      teamWorkExperience: data.team_work_experience || "",
      totalExperience: Math.floor(data.experience_month || 0),  // English: experience_month
      whatsapp: data.whatsapp || "",
      workExperience: "",
      resumeUrl: data.cv_file || "",  // English: cv_file
    },
    isSenior: checkSeniorityLevel(
      Math.floor((data.experience_month || 0) / 12) > SENIOR_YEAR_EXPERIENCE || false
    ),
    survey: {
      companyInterestReason: "",
      formResponsesLink: "",
      multipleDeadlinesStrategy: "",
      prdForeignLanguageApproach: "",
      remoteWorkInterest: "",
      submittedFormResponses: "",
    },
    attendStatus: "",
    dateStandardized: data.date_scraped || "",
    finalDecision: "",
    formTimestamp: data.date_scraped || "",
    processedStatus: (data.candidate_status as CandidateStatusEnum) || CandidateStatusEnum.applied,
    id: candidateId,
    appliedAt: data.date_scraped,
    
    // ===== ALL DB COLUMNS MAPPED HERE =====
    // Add raw database fields for easy access in detail page (matching actual database schema)
    rawData: {
      uuid: candidateId,
      name: data.name,
      age: data.age,
      gender: data.gender,
      location: data.location,
      experience_month: data.experience_month,
      highest_degree: data.highest_degree,
      job_preference: data.job_preference,
      location_preference: data.location_preference,
      instagram: data.instagram,
      linkedin: data.linkedin,
      github: data.github,
      codepen: data.codepen,
      facebook: data.facebook,
      twitter: data.twitter,
      certificate: data.certificate,
      volunteer_organization_experience: data.volunteer_organization_experience,
      awards_from_preference: data.awards_from_preference,
      expected_salary: data.expected_salary,
      about_me: data.about_me,
      skills: data.skills,
      education: data.education,
      awards: data.awards,
      organization: data.organization,
      whatsapp: data.whatsapp,
      email: data.email || "",
      cv_file: data.cv_file,
      date_scraped: data.date_scraped,
      applied_as: data.applied_as,
      candidate_status: data.candidate_status,
      website: data.website,
    }
  };
}

export function TransfromCandidateStages(
  data: CandidateStagesDto[]
): CandidateStages[] {
  return data.map((item) => ({
    candidateId: item.candidate_id,
    createdBy: item.created_by,
    emailSentAt: item.email_sent_at,
    id: item.id,
    stage: item.stage_key || CandidateStatusEnum.applied,
    durationSeconds: item.duration_seconds,
    enteredAt: item.entered_at,
    exitedAt: item.exited_at,
    privateNotes: item.hr_private_notes,
    sendEmailOnReject: item.send_email_on_reject,
    stageKey: item.stage_key,
    stageOrder: stagesOrderFormatter(
      item.stage_key || CandidateStatusEnum.applied
    ),
  }));
}

export function TransformMetadata(data?: MetadataDto): Metadata | undefined {
  if (!data) return;
  return {
    page: data.page,
    perPage: data.per_page,
    totalPage: data.total_pages,
    totalItems: data.total_items, // may be undefined if backend not updated yet
  };
}
