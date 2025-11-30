import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserItem } from "./user-item";
import { RecruitmentAction } from "./recruitment-action";
import { CandidateStatusEnum } from "@/core/utils/enums/candidates";
import { CardFooter } from "@/components/tiptap-ui-primitive/card";
import RecruitmentFlow from "./(recruitment-flow)/recruitment-flow";

export default function LoadingPage() {
  return <main className="space-y-8">
    <Card>
      <CardHeader className="lg:flex lg:justify-between items-center">
        <div className="flex gap-1 items-center">

          <CardTitle className="lg:text-xl font-semibold border-l-4 px-4 border-violet-600">Candidate detail</CardTitle>
        </div>
        <RecruitmentAction className="max-sm:hidden" resumeUrl={""} candidateId={""} candidateStatus={CandidateStatusEnum.applied} defaultLoading />

      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-4 gap-4">
          <UserItem label="Name" isLoading value="" />
          <UserItem label="Email" isLoading value="" />
          <UserItem label="Phone number" isLoading value="" />
          <UserItem label="Applied at" isLoading value="" />
        </div>
      </CardContent>
      <CardFooter className="md:hidden w-full">
        <RecruitmentAction className="md:hidden w-full grid grid-cols-2 gap-2 space-x-0 space-y-0" resumeUrl={""} candidateId={""} candidateStatus={CandidateStatusEnum.applied} defaultLoading />
      </CardFooter>
    </Card>
    <RecruitmentFlow id={""} candidateStages={[]} isLoading />
    {/* <RecruitmentDetail candidateDetail={undefined}  /> */}
  </main>;
}
