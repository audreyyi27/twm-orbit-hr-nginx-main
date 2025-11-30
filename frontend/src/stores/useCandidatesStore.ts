import { CandidateStatusEnum } from "@/core/utils/enums/candidates";
import { create } from "zustand";

type BaseCandidateStatus = Exclude<
  CandidateStatusEnum,
  CandidateStatusEnum.all
>;
interface CandidatesStore {
  applicantCountSummary: Record<BaseCandidateStatus, number>;
  setApplicantSummary: (key: BaseCandidateStatus, value: string) => void;
  setAllApplicantSummary: (val: Record<BaseCandidateStatus, number>) => void;
}

export const useCandidateStore = create<CandidatesStore>((set) => ({
  applicantCountSummary: {
    applied: 0,
    coding_test: 0,
    hired: 0,
    interview_general_manager: 0,
    offer: 0,
    rejected: 0,
    resume_scraped: 0,
    screened: 0,
    survey: 0,
    interview_team_lead: 0,
  },
  setApplicantSummary: (key, value) =>
    set((state) => ({
      applicantCountSummary: { ...state.applicantCountSummary, [key]: value },
    })),
  setAllApplicantSummary: (val) => set({ applicantCountSummary: val }),
}));
