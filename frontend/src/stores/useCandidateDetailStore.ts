import { Candidate } from "@/core/candidates/domain";
import { CandidateStatusEnum } from "@/core/utils/enums/candidates";
import { create } from "zustand";

interface CandidateDetailStore {
  detail: Candidate | undefined;
  focusedRecruitmentFlow: CandidateStatusEnum;
  setFocusedRecruitmentFlow: (val: CandidateStatusEnum) => void;
  setCandidate: (val: Candidate) => void;
  updateCandidate: (
    key: keyof Candidate,
    value: string | number | undefined
  ) => void;
}

export const useCandidateDetailStore = create<CandidateDetailStore>((set) => ({
  detail: undefined,
  setCandidate: (detail) => set({ detail }),
  updateCandidate: (key, value) =>
    set((state) => {
      if (!state.detail) {
        return state;
      }
      return {
        detail: {
          ...state.detail,
          [key]: value,
        },
      };
    }),
  focusedRecruitmentFlow: CandidateStatusEnum.applied,
  setFocusedRecruitmentFlow: (focusedRecruitmentFlow) =>
    set({ focusedRecruitmentFlow }),
}));
