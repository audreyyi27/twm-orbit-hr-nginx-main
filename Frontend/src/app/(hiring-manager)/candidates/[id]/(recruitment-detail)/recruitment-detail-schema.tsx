/* eslint-disable @typescript-eslint/no-explicit-any */
import { Candidate } from "@/core/candidates";
import z from "zod";


export function getDefaultValues<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
): z.infer<typeof schema> {
  const defaults = {} as z.infer<typeof schema>;

  for (const key of Object.keys(schema.shape) as Array<keyof T>) {
    const def = schema.shape[key];

    // Explicit Zod defaults
    if ("_def" in def && (def as any)._def.defaultValue !== undefined) {
      const defaultValue = (def as any)._def.defaultValue;
      (defaults as any)[key] =
        typeof defaultValue === "function" ? defaultValue() : defaultValue;
      continue;
    }

    // Fallbacks
    if ((def as any).isOptional?.()) {
      if (def instanceof z.ZodString) {
        (defaults as any)[key] = "";
      } else if (def instanceof z.ZodNumber) {
        (defaults as any)[key] = 0;
      } else if (def instanceof z.ZodBoolean) {
        (defaults as any)[key] = false;
      } else if (def instanceof z.ZodDate) {
        // React <input type="date"> expects a string, not Date/null
        (defaults as any)[key] = "";
      } else {
        // fallback for unknown → empty string (safe for inputs)
        (defaults as any)[key] = "";
      }
    } else {
      (defaults as any)[key] = "";
    }
  }

  return defaults;
}
export const candidateSchema = z.object({
  email: z.email(),

  // basic optional info
  name: z.string().optional(),
  whatsapp: z.string(),

  // numeric/metric fields
  total_experience: z.number().optional(),
  highest_degree: z.string().optional(),
  salary_expectation: z.number().optional(),

  // booleans
  qualified_criteria1: z.boolean().optional(),
  qualified_criteria2: z.boolean().optional(),

  // timestamps (ISO strings)
  date_standardized: z.date().optional(),
  form_timestamp: z.date().optional(),

  // textual fields
  work_experience: z.string().optional(),
  last_project_description: z.string().optional(),
  primary_programming_language: z.string().optional(),
  programming_language_experience: z.string().optional(),
  operating_systems: z.string().optional(),
  frameworks_libraries: z.string().optional(),
  server_experience: z.string().optional(),
  domicile: z.string().optional(),

  // status (string by default; use nativeEnum if you have the enum)
  processed_status: z.string().optional(),
  // processed_status: z.nativeEnum(CandidateStatus).optional(), // <- use this if CandidateStatus enum is available

  // more textual fields
  os_skills: z.string().optional(),
  development_methodology: z.string().optional(),
  learning_new_tech_reaction: z.string().optional(),
  environment_change_readiness: z.string().optional(),
  team_work_experience: z.string().optional(),
  remote_work_experience: z.string().optional(),
  ai_ml_experience: z.string().optional(),
  tools_ide_used: z.string().optional(),
  learning_new_skills: z.string().optional(),
  learning_sources: z.string().optional(),
  git_experience: z.string().optional(),
  virtualization_experience: z.string().optional(),
  prd_foreign_language_approach: z.string().optional(),
  multiple_deadlines_strategy: z.string().optional(),
  complex_project_experience: z.string().optional(),
  ai_tools_usage: z.string().optional(),
  remote_work_interest: z.string().optional(),
  company_interest_reason: z.string().optional(),

  // coding / interview
  coding_test_date: z.string().optional(),
  team_lead_interview_date: z.string().optional(),
  final_interview_date: z.string().optional(),
  final_decision: z.string().optional(),
  form_responses_link: z.string().optional(),
  coding_test: z.string().optional(),
  interview_status: z.string().optional(),
  coding_score: z.number().optional(),
  interview_date: z.string().optional(),
  interview_panel: z.string().optional(),
  panel: z.string().optional(),
  meeting_link: z.string().optional(),
  host_password: z.string().optional(),
  team_lead_interview: z.string().optional(),
  salary_nego: z.number().optional(),

  criteria_1: z.string().optional(),
  criteria_2: z.string().optional(),
  submitted_form_responses: z.string().optional(),
  test_language_confirmation: z.string().optional(),
  attend_status: z.string().optional(),
  assigned_recruiter: z.string().optional(),
  notes: z.string().optional(),
  resume_url: z.string().optional(),

  // audit fields
  applied_at: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type CandidateSchemaType = z.infer<typeof candidateSchema>



export function mapCandidateToDtoSchema(
  candidate?: Candidate
): CandidateSchemaType {
  return {
    email: candidate?.profile?.email ?? "",

    name: candidate?.profile?.name,
    whatsapp: candidate?.profile?.whatsapp ? candidate?.profile?.whatsapp.toString() : "",

    total_experience: candidate?.profile?.totalExperience,
    highest_degree: candidate?.profile?.highestDegree,
    salary_expectation: candidate?.profile?.salaryExpectation,
    work_experience: candidate?.profile?.workExperience,
    domicile: candidate?.profile?.domicile,

    last_project_description: candidate?.developerExperience?.lastProjectDescription,
    primary_programming_language:
      candidate?.developerExperience?.programingLanguageExperience?.language,
    programming_language_experience:
      candidate?.developerExperience?.programingLanguageExperience?.experience,
    operating_systems: candidate?.developerExperience?.operatingSystems,
    frameworks_libraries: candidate?.developerExperience?.frameworksLibraries,
    server_experience: candidate?.developerExperience?.serverExperience,
    os_skills: candidate?.developerExperience?.osSkills,
    development_methodology: candidate?.developerExperience?.developmentMethodology,
    learning_new_tech_reaction: candidate?.developerExperience?.learningNewTechReaction,
    environment_change_readiness:
      candidate?.developerExperience?.environmentChangeReadiness,
    tools_ide_used: candidate?.developerExperience?.toolsIdeUsed,
    git_experience: candidate?.developerExperience?.gitExperience,
    virtualization_experience: candidate?.developerExperience?.virtualizationExperience,
    complex_project_experience:
      candidate?.developerExperience?.complexProjectExperience,
    ai_tools_usage: candidate?.developerExperience?.aiToolsUsage,
    learning_new_skills: candidate?.developerExperience?.learningNewSkills,

    remote_work_interest: candidate?.survey?.remoteWorkInterest,
    company_interest_reason: candidate?.survey?.companyInterestReason,
    prd_foreign_language_approach:
      candidate?.survey?.prdForeignLanguageApproach,
    multiple_deadlines_strategy: candidate?.survey?.multipleDeadlinesStrategy,
    submitted_form_responses: candidate?.survey?.submittedFormResponses,
    form_responses_link: candidate?.survey?.formResponsesLink,

    coding_test_date: candidate?.codingTest?.codingTestDate,
    coding_test: candidate?.codingTest?.codingTest,
    coding_score: candidate?.codingTest?.codingScore,
    test_language_confirmation: candidate?.codingTest?.testLanguageConfirmation,

    interview_date: candidate?.interview?.interviewDate,
    team_lead_interview: candidate?.interview?.teamLeadInterview,
    interview_panel: candidate?.interview?.interviewPanel,
    final_interview_date: candidate?.interview?.finalInterviewDate,
    team_lead_interview_date: candidate?.interview?.teamLeadInterviewDate,
    interview_status: candidate?.interview?.interviewStatus,
    meeting_link: candidate?.interview?.meetingLink,
    panel: candidate?.interview?.panel,
    host_password: candidate?.interview?.hostPassword,
    salary_nego: candidate?.interview?.salaryNego,

    // TODO: fill in when you have these fields in your domain Candidate
    qualified_criteria1: undefined,
    qualified_criteria2: undefined,
    date_standardized: undefined,
    form_timestamp: undefined,
    processed_status: candidate?.processedStatus,
    final_decision: undefined,
    criteria_1: undefined,
    criteria_2: undefined,
    attend_status: undefined,
    assigned_recruiter: undefined,
    resume_url: candidate?.profile?.resumeUrl,

    applied_at: candidate?.appliedAt,
  };
}

