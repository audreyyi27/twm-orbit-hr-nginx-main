"use client"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";
import { useCandidateDetailStore } from "@/stores/useCandidateDetailStore";
import RecruitmentDetailForm from "./recruitement-detail-form";
import { Candidate } from "@/core/candidates";


interface RecruitmentDetailProps {
  candidateDetail: Candidate
}
export default function RecruitmentDetail(props: RecruitmentDetailProps) {
  const { setCandidate, setFocusedRecruitmentFlow } = useCandidateDetailStore()
  useEffect(() => {
    setCandidate(props.candidateDetail)
    setFocusedRecruitmentFlow(props.candidateDetail.processedStatus)
  }, [props.candidateDetail, setCandidate, setFocusedRecruitmentFlow])

  return <Card>
    <CardHeader>
      <CardTitle>
        Recruitment detail
      </CardTitle>
    </CardHeader>
    <CardContent>
      <RecruitmentDetailForm />
    </CardContent>
    <CardFooter>

    </CardFooter>
  </Card>
}