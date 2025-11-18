"use client"
import { CandidateStatusEnum } from "@/core/utils/enums/candidates"
import { cn } from "@/lib/utils"
import { useCandidateDetailStore } from "@/stores/useCandidateDetailStore"
import { ArrowRight, CheckCheck } from "lucide-react"

interface RecruitmentNodeProps {
  passed: boolean
  isRejected: boolean,
  isHired: boolean,
  lastFlow: boolean,
  currentFlow: boolean,
  title: string,
  value: CandidateStatusEnum,
}
export default function RecruitmentNode(props: RecruitmentNodeProps) {
  const { focusedRecruitmentFlow, setFocusedRecruitmentFlow } = useCandidateDetailStore()
  if (props.value == CandidateStatusEnum.rejected || props.value == CandidateStatusEnum.all) {
    return <></>
  }
  return <>
    <button onClick={() => props.passed || props.currentFlow ? setFocusedRecruitmentFlow(props.value) : {}} className={cn(
      "px-3 py-1.5 rounded-sm text-sm font-semibold flex gap-1 items-center justify-center bg-neutral-100 text-neutral-800 min-w-20 max-sm:w-full",
      focusedRecruitmentFlow == props.value ? "border border-amber-500" : "",
      props.isHired || props.passed ? "bg-green-100 text-green-800" :
        props.isRejected && props.currentFlow ? "bg-red-100 text-red-800" : props.currentFlow ? "bg-amber-100 text-amber-800" : "",
    )}>
      {(props.isHired || props.passed) && <CheckCheck className="w-4 h-4 inline" />}
      <span className="capitalize">
        {props.title}
      </span>
    </button>
    {!props.lastFlow && <ArrowRight className="w-3 h-3 max-sm:rotate-90" />}
  </>
}