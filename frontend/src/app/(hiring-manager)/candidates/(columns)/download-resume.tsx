"use client"

import { Button } from "@/components/ui/button"
import { GetCandidateResumeService } from "@/core/candidates"
import { useTransition } from "react"
import { toast } from "sonner"

interface DownloadResumeProps {
  id: string
}
export default function DownloadResume(props: DownloadResumeProps) {
  const [loadingResume, startLoadingResume] = useTransition()
  const handleOpenResume = async () => {
    startLoadingResume(async () => {
      const res = await GetCandidateResumeService(props.id)
      if (res.isError || !res.data) {
        toast.error(res.message)
      } else {
        window.open(URL.createObjectURL(res.data), "_blank")
      }
    })
  }
  return <Button onClick={handleOpenResume} size={"sm"} loading={loadingResume} variant={"ghost"}>Resume</Button>

}