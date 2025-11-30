import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import RecruitmentFlow from "./(recruitment-flow)/recruitment-flow"
import { Badge } from "@/components/ui/badge"
import { GetCandidateDetailService } from "@/core/candidates"
import { redirect } from "next/navigation"
import { UserItem } from "./user-item"
import { RecruitmentAction, RecruitmentDetail } from "./client-wrapper"
import DatabaseFieldsDisplay from "./(recruitment-detail)/database-fields-display"



export default async function CandidateDetailPage(props: PageProps<"/candidates/[id]">) {
  const { id } = await props.params
  const { data, isError, message, statusCode } = await GetCandidateDetailService(id)
  if (statusCode == 401 || statusCode == 403) {
    // redirect(`/api/auth/clear-cookies`)
    redirect('/')
  }
  if (isError || !data?.candidate) {
    return <>{message}</>
  }
  return <main className="space-y-8">
    <Card>
      <CardHeader className="md:flex md:justify-between gap-4 items-center">
        <div className="flex gap-1 items-center">

          <CardTitle className="lg:text-xl font-semibold border-l-4 px-4 border-violet-600">Candidate detail</CardTitle>
          {data.candidate.isSenior ? <Badge>Senior</Badge> : <></>}
        </div>
        <RecruitmentAction className="max-md:hidden" resumeUrl={data.candidate.profile.resumeUrl || ""} candidateId={data.candidate.id} candidateStatus={data.candidate.processedStatus} />
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <UserItem label="Name" value={data.candidate.profile.name || ""} />
          <UserItem label="Email" value={data.candidate.profile.email || ""} />
          <UserItem label="Phone number" value={data.candidate.profile.whatsapp?.toString() || "-"} />
          <UserItem label="Applied at" value={data.candidate.appliedAt || "-"}
          />
        </div>
      </CardContent>
      <CardFooter className="md:hidden w-full">
        <RecruitmentAction className="md:hidden w-full grid grid-cols-2 gap-2 space-x-0 space-y-0" resumeUrl={data.candidate.profile.resumeUrl || `/ candidates / ${id}`} candidateId={data.candidate.id} candidateStatus={data.candidate.processedStatus} />
      </CardFooter>
    </Card>
    <RecruitmentFlow id={id} isSenior={data.candidate.isSenior} candidateStages={data.stages} />
    <DatabaseFieldsDisplay candidate={data.candidate} />
    <RecruitmentDetail candidateDetail={data.candidate} />
  </main>
}



