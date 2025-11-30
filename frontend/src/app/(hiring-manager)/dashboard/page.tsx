import { Card, CardContent } from "@/components/ui/card";
import RangeFilter from "./range-filter";
import RecruitmentOverviewChart from "./(chart)/recruitment-overview-chart";
import { PeriodEnum } from "@/core/utils/enums/dashboard";
import { GetCandidateStageStatisticServices } from "@/core/dashboards";
import { redirect } from "next/navigation";
import { LogoutService } from "@/core/user";

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const { range_filter, startDate, endDate } = await searchParams
  const { data, statusCode } = await GetCandidateStageStatisticServices({
    period: range_filter as PeriodEnum || PeriodEnum.weekly,
    from: startDate ? startDate as string : undefined,
    to: endDate ? endDate as string : undefined
  })
  if (statusCode == 401 || statusCode == 403) {
    await LogoutService()
    await fetch('/api/auth/clear-cookies', { method: 'POST' });
    redirect(`/`)
  }
  return <div className="space-y-4">
    <div className="">
      <h1 className="lg:text-xl font-semibold">Dashboard</h1>
    </div>
    <RangeFilter />
    <Card>
      <CardContent>
        <RecruitmentOverviewChart data={data?.buckets || []} />
      </CardContent>
    </Card>
  </div>
}