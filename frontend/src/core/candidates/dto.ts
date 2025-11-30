import { CandidateStatusEnum } from "../utils/enums/candidates";

export interface GetCandidatesDto {
  page: string;
  perPage: string;
  search?: string;
  sortBy?: string;
  filterBy?: string;
  startDate?: string;
  endDate?: string;
}

export interface CandidateDto {
  // Match backend English field names (from schemas.py Candidate model)
  uuid: string;
  email?: string;
  name?: string;
  whatsapp?: string;
  
  // English field names from backend model
  age?: number;
  gender?: string;
  location?: string;
  experience_month?: number;
  highest_degree?: string;
  job_preference?: string;
  location_preference?: string;
  
  // Social media
  instagram?: string;
  linkedin?: string;
  github?: string;
  codepen?: string;
  facebook?: string;
  twitter?: string;
    website?: string;
  
  // Additional English fields from backend
  certificate?: string;
  volunteer_organization_experience?: string;
  awards_from_preference?: string;
  expected_salary?: string;
  about_me?: string;
  skills?: string;
  education?: string;
  awards?: string;
  organization?: string;
  
  // Date and position
  date_scraped?: string;  // ISO timestamp
  applied_as?: string;  // junior developer / senior developer
  
  // Status
  candidate_status?: string;  // CandidateStatusEnum from backend
  
  // CV
  cv_file?: string;
  os_skills?: string;
  development_methodology?: string;
  learning_new_tech_reaction?: string;
  environment_change_readiness?: string;
  team_work_experience?: string;
  remote_work_experience?: string;
  ai_ml_experience?: string;
  tools_ide_used?: string;
  learning_new_skills?: string;
  learning_sources?: string;
  git_experience?: string;
  virtualization_experience?: string;
  prd_foreign_language_approach?: string;
  multiple_deadlines_strategy?: string;
  complex_project_experience?: string;
  ai_tools_usage?: string;
  remote_work_interest?: string;
  company_interest_reason?: string;
  coding_test_date?: string;
  team_lead_interview_date?: string;
  final_interview_date?: string;
  final_decision?: string;
  form_responses_link?: string;
  coding_test?: string;
  interview_status?: string;
  coding_score?: number;
  interview_date?: string; // ISO timestamp
  interview_panel?: string;
  panel?: string;
  meeting_link?: string;
  host_password?: string;
  team_lead_interview?: string;
  salary_nego?: number;
  criteria_1?: string;
  criteria_2?: string;
  submitted_form_responses?: string;
  test_language_confirmation?: string;
  attend_status?: string;
  assigned_recruiter?: string;
  notes?: string;
  resume_url?: string;
  applied_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PostCandidateDto {
  candidateData: File;
}
export interface PostCandidateCvDto {
  candidateCv: File;
}
export type PutCandidateDto = Partial<Omit<CandidateDto, "id">>;

export interface CandidateStagesDto {
  id: string;
  candidate_id: string;
  stage_key?: CandidateStatusEnum;
  entered_at?: string;
  exited_at?: string;
  duration_seconds?: number;
  hr_private_notes?: string;
  send_email_on_reject?: boolean;
  email_sent_at?: string;
  created_by?: string;
}
export interface PostCandidateStagesDto {
  id: string[];
  note: string;
  candidate_status: CandidateStatusEnum;
}

export interface GetEmailTemplateDto {
  type:
    | "rejection"
    | "survey"
    | "coding-test"
    | "interview-team-lead"
    | "interview-gm"
    | "offering"
    | "hired";
}

export interface PostSendEmailDto {
  subject: string;
  body: string;
}
