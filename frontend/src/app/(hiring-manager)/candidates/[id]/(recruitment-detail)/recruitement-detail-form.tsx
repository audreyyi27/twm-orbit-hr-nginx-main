"use client"
import { useEffect, useState, useTransition } from "react";
import { candidateSchema, CandidateSchemaType, getDefaultValues, mapCandidateToDtoSchema } from "./recruitment-detail-schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCandidateDetailStore } from "@/stores/useCandidateDetailStore";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import DefaultInput from "@/components/form-input/default-input";

import { toast } from "sonner";
import { PutCandidateDto, PutCandidateService } from "@/core/candidates";
import { CandidateStatusEnum } from "@/core/utils/enums/candidates";
import { useRouter } from "next/navigation";
import { LogoutService } from "@/core/user";

const DEFAULT_CANDIDATES = [CandidateStatusEnum.applied, CandidateStatusEnum.hired, CandidateStatusEnum.offer, CandidateStatusEnum.resume_scraped, CandidateStatusEnum.screened, CandidateStatusEnum.rejected]
const SURVEY_CANDIDATES = [CandidateStatusEnum.survey]
const CODING_TEST_CANDIDATES = [CandidateStatusEnum.coding_test]
const INTERVIEW_TEST_CANDIDATES = [CandidateStatusEnum.interview_lead, CandidateStatusEnum.interview_gm]

export default function RecruitmentDetailForm() {
  const { detail, focusedRecruitmentFlow } = useCandidateDetailStore()
  const router = useRouter()
  const schema = candidateSchema
  const form = useForm<CandidateSchemaType>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(schema)
  })
  const [isUpdate, setUpdate] = useState(false)
  const [isLoading, startLoading] = useTransition()
  useEffect(() => {
    if (!detail) return

    const formValues = mapCandidateToDtoSchema(detail)
    form.reset(formValues)

  }, [form, detail])
  const onSubmit = async (value: CandidateSchemaType) => {
    startLoading(async () => {
      if (!detail) return;

      const data: PutCandidateDto = {
        email: value.email || "",
        name: value.name || "",
        whatsapp: value.whatsapp || "",
        experience_month: value.total_experience ?? undefined, // Map total_experience to experience_month (both in months)
        highest_degree: value.highest_degree || "",
        expected_salary: value.salary_expectation?.toString() || undefined, // Map salary_expectation to expected_salary (string)
        // Note: Fields that don't exist in CandidateDto are excluded:
        // - last_project_description, primary_programming_language, programming_language_experience
        // - operating_systems, frameworks_libraries, server_experience, work_experience
        // - qualified_criteria1, qualified_criteria2, processed_status
        location: value.domicile || undefined, // Map domicile to location
        os_skills: value.os_skills || "",
        development_methodology: value.development_methodology || "",
        learning_new_tech_reaction: value.learning_new_tech_reaction || "",
        environment_change_readiness: value.environment_change_readiness || "",
        team_work_experience: value.team_work_experience || "",
        remote_work_experience: value.remote_work_experience || "",
        ai_ml_experience: value.ai_ml_experience || "",
        tools_ide_used: value.tools_ide_used || "",
        learning_new_skills: value.learning_new_skills || "",
        learning_sources: value.learning_sources || "",
        git_experience: value.git_experience || "",
        virtualization_experience: value.virtualization_experience || "",
        prd_foreign_language_approach: value.prd_foreign_language_approach || "",
        multiple_deadlines_strategy: value.multiple_deadlines_strategy || "",
        complex_project_experience: value.complex_project_experience || "",
        ai_tools_usage: value.ai_tools_usage || "",
        remote_work_interest: value.remote_work_interest || "",
        company_interest_reason: value.company_interest_reason || "",
        coding_test_date: value.coding_test_date || "",
        team_lead_interview_date: value.team_lead_interview_date || "",
        final_interview_date: value.final_interview_date || "",
        final_decision: value.final_decision || "",
        form_responses_link: value.form_responses_link || "",
        coding_test: value.coding_test || "",
        interview_status: value.interview_status || "",
        coding_score: value.coding_score ?? 0,
        interview_date: value.interview_date || "",
        interview_panel: value.interview_panel || "",
        panel: value.panel || "",
        meeting_link: value.meeting_link || "",
        host_password: value.host_password || "",
        team_lead_interview: value.team_lead_interview || "",
        salary_nego: value.salary_nego ?? 0,
        criteria_1: value.criteria_1 || "",
        criteria_2: value.criteria_2 || "",
        submitted_form_responses: value.submitted_form_responses || "",
        test_language_confirmation: value.test_language_confirmation || "",
        attend_status: value.attend_status || "",
        assigned_recruiter: value.assigned_recruiter || "",
        notes: value.notes || "",
        resume_url: value.resume_url || "",
        applied_at: value.applied_at || "",
      };

      const res = await PutCandidateService(detail.id.toString(), data);
      if (res.statusCode == 401 || res.statusCode == 403) {
        await LogoutService()
        await fetch('/api/auth/clear-cookies', { method: 'POST' });
        router.push(`/`)
      }
      if (res.isError) {
        toast.error(res.message);
      } else {
        toast.success("Candidate updated successfully!");
      }
    });
  };

  return <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Default candidate field */}
      {DEFAULT_CANDIDATES.includes(focusedRecruitmentFlow || "") &&
        <section className="grid md:grid-cols-2 gap-2 lg:gap-4">
          <DefaultInput form={form} label="Total Experience" name="total_experience" inputOptions={{ disabled: !isUpdate, onChange: (e) => form.setValue("total_experience", e.target.valueAsNumber ? e.target.valueAsNumber : 0) }} type="number" />
          <DefaultInput form={form} label="Highest Degree" name="highest_degree" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Work Experience" name="work_experience" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Domicile" name="domicile" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Remote Work Experience" name="remote_work_experience" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Team Work Experience" name="team_work_experience" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="AI/ML Experience" name="ai_ml_experience" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Salary Expectation" name="salary_expectation" inputOptions={{ disabled: !isUpdate, onChange: (e) => form.setValue("salary_expectation", e.target.valueAsNumber) }} type="number" />
        </section>
      }

      {/* Survey Candidate field */}
      {SURVEY_CANDIDATES.includes(focusedRecruitmentFlow || "") &&
        <section className="grid md:grid-cols-2 gap-2 lg:gap-4">
          <DefaultInput form={form} label="Operating Systems" name="operating_systems" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Last Project Description" name="last_project_description" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Programming Language" name="primary_programming_language" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Programming Experience" name="programming_language_experience" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Frameworks/Libraries" name="frameworks_libraries" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Server Experience" name="server_experience" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="OS Skills" name="os_skills" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Development Methodology" name="development_methodology" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Reaction to New Tech" name="learning_new_tech_reaction" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Readiness for Environment Change" name="environment_change_readiness" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Tools/IDE Used" name="tools_ide_used" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Git Experience" name="git_experience" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Learning Sources" name="learning_sources" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Virtualization Experience" name="virtualization_experience" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Complex Project Experience" name="complex_project_experience" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="AI Tools Usage" name="ai_tools_usage" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Learning New Skills" name="learning_new_skills" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Remote Work Interest" name="remote_work_interest" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Company Interest Reason" name="company_interest_reason" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Foreign Language Approach" name="prd_foreign_language_approach" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Multiple Deadlines Strategy" name="multiple_deadlines_strategy" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Submitted Form Responses" name="submitted_form_responses" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Form Responses Link" name="form_responses_link" inputOptions={{ disabled: !isUpdate }} type="text" />
        </section>
      }

      {/* Coding candidate field  */}
      {CODING_TEST_CANDIDATES.includes(focusedRecruitmentFlow || "") &&
        <section className="grid md:grid-cols-2 gap-2 lg:gap-4">
          <DefaultInput form={form} label="Coding Test Date" name="coding_test_date" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Coding Test" name="coding_test" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Coding Score" name="coding_score" inputOptions={{ disabled: !isUpdate, onChange: (e) => form.setValue("coding_score", e.target.valueAsNumber) }} type="number" />
          <DefaultInput form={form} label="Test Language Confirmation" name="test_language_confirmation" inputOptions={{ disabled: !isUpdate }} type="text" />
        </section>
      }


      {/* Interview candidate field */}
      {INTERVIEW_TEST_CANDIDATES.includes(focusedRecruitmentFlow || "") &&
        <section className="grid md:grid-cols-2 gap-2 lg:gap-4">
          <DefaultInput form={form} label="Interview Date" name="interview_date" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Team Lead Interview" name="team_lead_interview" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Interview Panel" name="interview_panel" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Final Interview Date" name="final_interview_date" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Team Lead Interview Date" name="team_lead_interview_date" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Interview Status" name="interview_status" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Meeting Link" name="meeting_link" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Panel" name="panel" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Host Password" name="host_password" inputOptions={{ disabled: !isUpdate }} type="text" />
          <DefaultInput form={form} label="Salary Negotiation" name="salary_nego" inputOptions={{ disabled: !isUpdate }} type="text" />
        </section>
      }

      {/*  button action field */}
      <div className="flex justify-end gap-4">
        {isUpdate ?
          <Button type="button" variant={"ghost"} loading={isLoading} onClick={() => setUpdate(false)}>Cancel</Button>
          :
          <Button type="button" onClick={() => setUpdate(true)}>Update</Button>
        }
        {isUpdate ?
          <Button type="submit" loading={isLoading}>Save change</Button>
          :
          <></>
        }
      </div>
    </form>
  </Form>
}