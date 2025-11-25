import { Card, CardContent } from "@/components/ui/card";
import RangeFilter from "./range-filter";

export default function LoadingDashboardPage() {
  return <div className="space-y-4">
    <div className="">
      <h1 className="lg:text-xl font-semibold">Dashboard</h1>
    </div>
    <RangeFilter />
    <Card>
      <CardContent className="min-h-[50vh] grid items-center">
        <p className="mx-auto">
          Loading statistic
        </p>
      </CardContent>
    </Card>
  </div>
}