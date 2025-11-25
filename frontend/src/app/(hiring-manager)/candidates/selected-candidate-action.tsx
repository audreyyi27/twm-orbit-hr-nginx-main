"use client"
import { Modal, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from "@/components/modal"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useTableStore } from "@/stores/useDataTableStore"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { getNextCandidateStatus, PostBatchCandidateStagesService, PostCandidateStagesDto } from "@/core/candidates"
import { CandidateStatusEnum } from "@/core/utils/enums/candidates"
import { LogoutService } from "@/core/user"

export default function SelectedCandidateAction() {
  const { rowSelection, data } = useTableStore()
  const router = useRouter()
  const searchParam = useSearchParams()
  const [isLoading, startLoading] = useTransition()
  const [openApproveModal, setOpenApproveModal] = useState(false)
  const [openRejectModal, setOpenRejectModal] = useState(false)
  const getBatchIds = () => {
    let Ids: string[] = []
    const filter = searchParam.get('filterBy') || "all"
    if (filter == "all") return
    const rowIds = Object.keys(rowSelection).map((i) => data[+i].candidateId || data[+i].id)
    Ids = rowIds as string[]
    return Ids
  }
  const handleBatchApproved = async (note: string) => {
    const filter = searchParam.get('filterBy') || "all"
    if (filter == "all") {
      toast.error("Please specific the Recruitment process")
      return
    }
    const nextStage = getNextCandidateStatus(filter as CandidateStatusEnum)
    if (!nextStage) if (!nextStage) {
      toast.error("Can't update Recruitment process")
      return
    }
    startLoading(async () => {
      const ids = getBatchIds() || []
      if (ids.length == 0) return
      const data: PostCandidateStagesDto = {
        id: ids,
        note: note,
        candidate_status: nextStage
      }

      const res = await PostBatchCandidateStagesService(data)
      if (res.statusCode == 401 || res.statusCode == 403) {
        await LogoutService()
        await fetch('/api/auth/clear-cookies', { method: 'POST' });
        router.push(`/`)
      }
      if (res.isError) {
        toast.error(res.message as string)
      } else {
        toast.message(res.message as string)
        setOpenApproveModal(false)
      }


    })
  }
  const handleBatchRejected = async (note: string) => {
    const filter = searchParam.get('filterBy') || "all"
    const nextStage = getNextCandidateStatus(filter as CandidateStatusEnum)
    if (!nextStage) {
      toast.error("Can't update Recruitment process")
      return
    }

    startLoading(async () => {
      const ids = getBatchIds() || []
      if (ids.length == 0) return
      const data: PostCandidateStagesDto = {
        id: ids,
        note: note,
        candidate_status: CandidateStatusEnum.rejected
      }
      const res = await PostBatchCandidateStagesService(data)
      if (res.statusCode == 401 || res.statusCode == 403) {
        await LogoutService()
        await fetch('/api/auth/clear-cookies', { method: 'POST' });
        router.push(`/`)
      }
      if (res.isError) {
        toast.error(res.message as string)
      } else {
        toast.message(res.message as string)
        setOpenRejectModal(false)
      }

    })
  }
  return <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={"ghost"} className={cn(Object.values(rowSelection).length == 0 ? "hidden" : "")} loading={isLoading}>Batch update</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="">
        <DropdownMenuItem onClick={() => setOpenRejectModal(true)}>Rejected selected candidates</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setOpenApproveModal(true)}>Approved selected candidates</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <ConfirmationBatchUpdateModal
      trigger={null}
      title="Reject Selected Candidate"
      approvalTitle="Reject"
      description="Selected candidates will not move forward with application process"
      onApprove={handleBatchRejected}
      open={openRejectModal}
      setOpen={setOpenRejectModal}

    />
    <ConfirmationBatchUpdateModal
      trigger={null}
      title="Approve Selected Candidate to Next Step"
      approvalTitle="Approve"
      description="Selected candidates will continue to the next step"
      onApprove={handleBatchApproved}
      open={openApproveModal}
      setOpen={setOpenApproveModal}
    />
  </>
}
interface ConfirmationBatchUpdateModalProps {
  trigger: React.ReactNode,
  title: string,
  description: string,
  onApprove: (hrNote: string) => Promise<void>,
  approvalTitle: string,
  open: boolean,
  setOpen: (val: boolean) => void
}
function ConfirmationBatchUpdateModal(props: ConfirmationBatchUpdateModalProps) {
  const [isLoading, startloading] = useTransition()
  const [note, setNote] = useState("")

  const handleApprove = async () => {
    startloading(async () => {
      await props.onApprove(note)
    })
  }
  return <Modal
    isOpen={props.open}
    setOpen={props.setOpen}
    trigger={props.trigger}
  >
    <ModalHeader>
      <ModalTitle>{props.title}</ModalTitle>
      <ModalDescription>{props.description}</ModalDescription>
    </ModalHeader>
    <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add note to all candidates" />
    <ModalFooter>
      <Button variant={"destructive"} disabled={isLoading} onClick={() => props.setOpen(false)}>Cancel</Button>
      <Button variant={"ghost"} loading={isLoading} onClick={async () => handleApprove()}>{props.approvalTitle}</Button>
    </ModalFooter>
  </Modal>
}