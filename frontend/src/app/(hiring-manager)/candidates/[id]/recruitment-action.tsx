"use client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ComponentProps, useTransition } from "react"
import ConfirmationModal from "./confirmation-modal"
import { toast } from "sonner"
import SendEmailEditor from "./(recruitment-email)/send-email-editor"
import { GetCandidateResumeService, getNextCandidateStatus, PostCandidateStagesDto, PostCandidateStagesService } from "@/core/candidates"
import { CandidateStatusEnum } from "@/core/utils/enums/candidates"
import { useRouter } from "next/navigation"
import { LogoutService } from "@/core/user"

interface RecruitmentActionProps extends ComponentProps<"div"> {
  resumeUrl: string,
  disableAction?: boolean,
  candidateId: string,
  candidateStatus: CandidateStatusEnum,
  defaultLoading?: boolean
}
export function RecruitmentAction(props: RecruitmentActionProps) {
  const router = useRouter()
  const [loading, startLoading] = useTransition()
  const [loadingResume, startLoadingResume] = useTransition()
  const handleReject = async (note: string) => {
    startLoading(async () => {

      const data: PostCandidateStagesDto = {
        id: [props.candidateId.toString()],
        candidate_status: CandidateStatusEnum.rejected,
        note: note
      }
      const res = await PostCandidateStagesService(data)
      if (res.statusCode == 401 || res.statusCode == 403) {
        await LogoutService()
        await fetch('/api/auth/clear-cookies', { method: 'POST' });
        router.push(`/`)
      }
      if (res.isError) {
        toast.error(res.message as string)
      } else {
        toast.message(res.message as string)
        window.location.reload()
      }
    })
  }
  const handleApprove = async (note: string) => {
    startLoading(async () => {
      const nextCandidateStatus = getNextCandidateStatus(props.candidateStatus)
      if (!nextCandidateStatus) return
      const data: PostCandidateStagesDto = {
        id: [props.candidateId.toString()],
        candidate_status: nextCandidateStatus,
        note: note
      }
      const res = await PostCandidateStagesService(data)
      if (res.statusCode == 401 || res.statusCode == 403) {
        await LogoutService()
        await fetch('/api/auth/clear-cookies', { method: 'POST' });
        router.push(`/`)
      }
      if (res.isError) {
        toast.error(res.message as string)
      } else {
        toast.message(res.message as string)
        window.location.reload()
      }
    })

  }

  const handleOpenResume = async () => {
    startLoadingResume(async () => {
      const res = await GetCandidateResumeService(props.candidateId)
      if (res.statusCode == 401 || res.statusCode == 403) {
        await LogoutService()
        await fetch('/api/auth/clear-cookies', { method: 'POST' });
        router.push(`/`)
      }
      if (res.isError || !res.data) {
        toast.error(res.message)
      } else {
        window.open(URL.createObjectURL(res.data), "_blank")
      }
    })
  }


  return <div className={cn("space-x-2 space-y-2", props.className)}>
    <Button variant={"outline"} loading={loadingResume || props.defaultLoading} onClick={() => handleOpenResume()}>
      Resume
    </Button>
    <SendEmailEditor defaultLoading={props.defaultLoading} />
    <ConfirmationModal
      trigger={
        <Button
          variant={"destructive"}
          loading={loading || props.defaultLoading}
          disabled={props.disableAction || props.defaultLoading}>Reject</Button>
      }
      approvalTitle="Reject"
      title="Reject Candidate"
      description="Candidate will not move forward with application process"
      onApprove={async (note) => await handleReject(note)}
    />
    <ConfirmationModal
      trigger={
        <Button
          className="bg-green-600 hover:bg-green-700"
          loading={loading || props.defaultLoading}
          disabled={props.disableAction || props.defaultLoading}>Approve</Button>
      }
      approvalTitle="Approve"
      title="Approve to next step"
      description="Candidate will continue to the next step"
      onApprove={async (note) => await handleApprove(note)}
    />
  </div>
}



