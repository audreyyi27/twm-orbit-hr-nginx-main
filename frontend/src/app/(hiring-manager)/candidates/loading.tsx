

import { DataTable } from "@/components/data-table/data-table";
import RecruitmentNodeFilter from "./recruitment-node-filter";
import { DefaultColumnn } from "./(columns)/default-columns";

export default function Loading() {
  return <>
    <div className="flex w-full items-center">
      <h1 className="lg:text-xl font-semibold">All Candidates</h1>
    </div>
    <section className="py-4 space-y-4 w-full">
      <RecruitmentNodeFilter data={undefined} />
      <DataTable
        columns={DefaultColumnn}
        data={[]}
        totalpage={1}
        isLoading
      />
    </section>
  </>
}