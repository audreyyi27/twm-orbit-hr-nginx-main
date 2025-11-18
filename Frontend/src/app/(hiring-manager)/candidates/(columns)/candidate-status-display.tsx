import { Badge } from "@/components/ui/badge";
import { CandidateStatusEnum } from "@/core/utils/enums/candidates";

interface CandidateStatusButtonProps {
  status: CandidateStatusEnum
  title: string
}
export default function CandidateStatusDisplay(props: CandidateStatusButtonProps) {
  switch (props.status) {
    case CandidateStatusEnum.applied:
      return <Badge className="bg-fuchsia-100 text-fuchsia-600">{props.title}</Badge>
    case CandidateStatusEnum.coding_test:
      return <Badge className="bg-cyan-100 text-cyan-600">{props.title}</Badge>
    case CandidateStatusEnum.resume_scraped:
      return <Badge className="bg-teal-100 text-teal-600">{props.title}</Badge>
    case CandidateStatusEnum.rejected:
      return <Badge className="bg-red-100 text-red-600">{props.title}</Badge>
    case CandidateStatusEnum.interview_gm:
      return <Badge className="bg-violet-100 text-violet-600">{props.title}</Badge>
    case CandidateStatusEnum.interview_lead:
      return <Badge className="bg-amber-100 text-amber-600">{props.title}</Badge>
    case CandidateStatusEnum.hired:
      return <Badge className="bg-green-100 text-green-600">{props.title}</Badge>
    case CandidateStatusEnum.offer:
      return <Badge className="bg-pink-100 text-pink-600">{props.title}</Badge>
    case CandidateStatusEnum.screened:
      return <Badge className="bg-slate-100 text-slate-600">{props.title}</Badge>
    case CandidateStatusEnum.survey:
      return <Badge className="bg-indigo-100 text-indigo-600">{props.title}</Badge>
    default:
      return <Badge>{props.title}</Badge>

  }
}