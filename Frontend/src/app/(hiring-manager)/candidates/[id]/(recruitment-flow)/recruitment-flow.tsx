import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import RecruitmentNode from "./recruitment-node"
import { Fragment } from "react"
import { CandidateStages, RECRUITMENT_FLOW_ORDERS, reorderCandidateStage } from "@/core/candidates"
import { CandidateStatusEnum } from "@/core/utils/enums/candidates"
import { Skeleton } from "@/components/ui/skeleton"



interface RecruitmentFlowProps {
  id: string,
  isSenior?: boolean,
  candidateStages: CandidateStages[],
  isLoading?: boolean
}
export default async function RecruitmentFlow(props: RecruitmentFlowProps) {
  const orderedStages = reorderCandidateStage(props.candidateStages || [])
  const latestStage = orderedStages[orderedStages.length - 1] || CandidateStatusEnum.applied
  const isHired = Boolean(orderedStages.find(i => i.stageKey == CandidateStatusEnum.hired))
  const isRejected = Boolean(orderedStages.find(i => i.stageKey == CandidateStatusEnum.rejected))
  return <>
    <Card>
      <CardHeader>
        <CardTitle>Recruitment flow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex max-sm:flex-col gap-2 items-center flex-wrap overflow-x-hidden overflow-y-auto py-2">
          {RECRUITMENT_FLOW_ORDERS.map(item => {
            if (!props.isSenior && item.value == CandidateStatusEnum.interview_lead) return <Fragment key={item.value}></Fragment>
            if (props.isLoading) return <Skeleton key={item.value} className="w-[240] h-6" />
            return <RecruitmentNode
              currentFlow={item.value == latestStage.stageKey}
              isHired={isHired}
              isRejected={isRejected}
              key={item.value}
              passed={item.order < latestStage.stageOrder}
              lastFlow={item.value == CandidateStatusEnum.hired}
              title={item.title}
              value={item.value}
            />
          }

          )}
        </div>
      </CardContent>
      <CardFooter>

      </CardFooter>
    </Card>
  </>
}




