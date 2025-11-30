"use server"
import { DataTable } from "@/components/data-table/data-table"
import { DefaultColumnn } from "./(columns)/default-columns"
import { CodingTestColumnn } from "./(columns)/coding-test-columns"
import { InterviewColumnn } from "./(columns)/interview-columns"
import { SurveyColumnn } from "./(columns)/survey-column"
import { Candidate } from "@/core/candidates"
import { Metadata } from "@/core/types/base"
import { CandidateStatusEnum } from "@/core/utils/enums/candidates"

interface DataTableProps {
  page: string,
  perPage: string,
  filterBy?: string,
  candidates: Candidate[],
  meta?: Metadata
}

export default async function DataTableCandidates(props: DataTableProps) {

  switch (props.filterBy as CandidateStatusEnum) {
    case CandidateStatusEnum.coding_test:
      return <DataTable
        columns={CodingTestColumnn}
        data={props.candidates || []}
        totalpage={+(props?.meta?.totalPage || 1)}

      />
    case CandidateStatusEnum.interview_lead:
      return <DataTable
        columns={InterviewColumnn}
        data={props.candidates || []}
        totalpage={+(props?.meta?.totalPage || 1)}
      />
    case CandidateStatusEnum.interview_gm:
      return <DataTable
        columns={InterviewColumnn}
        data={props.candidates || []}
        totalpage={+(props?.meta?.totalPage || 1)}
      />
    case CandidateStatusEnum.survey:
      return <DataTable
        columns={SurveyColumnn}
        data={props.candidates || []}
        totalpage={+(props?.meta?.totalPage || 1)}

      />
    default:
      return <DataTable
        columns={DefaultColumnn}
        data={props.candidates || []}
        totalpage={+(props?.meta?.totalPage || 1)}

      />
  }

}
