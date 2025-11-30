"use client"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { Bar, BarChart, XAxis } from "recharts";



const chartConfig = {
  applied: {
    label: "Applied",
    color: "var(--chart-1)",
  },
  fail_coding_test: {
    label: "Fail coding test",
    color: "var(--chart-2)"
  },
  coding_test: {
    label: "Coding Test",
    color: "var(--chart-3)"
  },
  hired: {
    label: "Hired",
    color: "var(--chart-4)"
  },
  interview_general_manager: {
    label: "Interview General manager",
    color: "var(--chart-5)"
  },
  interview_team_lead: {
    label: "Interview Team Lead",
    color: "var(--chart-6)"
  },
  offer: {
    label: "Offer",
    color: "var(--chart-7)"
  },
  resume_scraped: {
    label: "Resume Scrapped",
    color: "var(--chart-9)"
  },
  screened: {
    label: "Screened",
    color: "var(--chart-10)"
  },
  survey: {
    label: "Survey",
    color: "var(--chart-11)"
  },
  unqualified: {
    label: "Unqualified",
    color: "var(oklch(0.77 0.20 131))"
  }
} satisfies ChartConfig
interface RecruitmentOverviewChartProps {
  data: Record<"startDate" | string, string | number>[]
}
export default function RecruitmentOverviewChart(props: RecruitmentOverviewChartProps) {
  const { setStatusFilterItems, statusFilter } = useDashboardStore()
  const [data, setData] = useState(props.data || [])
  useEffect(() => {
    const rows = Array.isArray(props.data) ? props.data : [];
    if (rows.length === 0) return;

    // keys from the first row
    const status = Object.keys(rows[0]).filter(k => k !== "startDate");

    setStatusFilterItems(status);
  }, [props.data, setStatusFilterItems]);

  useEffect(() => {
    if (!statusFilter) {
      setData(props.data)
      return
    }
    const excluded = new Set(
      typeof statusFilter === "string"
        ? statusFilter.split(",").map(s => s.trim()).filter(Boolean)
        : [statusFilter]
    );

    const cleaned = props.data.map(row => {
      const { startDate, ...rest } = row;
      const filtered = Object.fromEntries(
        Object.entries(rest).filter(([k]) => excluded.has(k))
      );
      return { startDate, ...filtered };
    });
    setData(cleaned)
  }, [props.data, statusFilter])
  return <>
    <ChartContainer config={chartConfig} className=" w-full h-[50vh]">
      <BarChart accessibilityLayer data={data}>
        <XAxis
          dataKey="startDate"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => format(new Date(value), "P")}
        />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Bar
          dataKey="applied"
          stackId="a"
          fill="var(--color-applied)"
          radius={[0, 0, 4, 4]}
        />
        <Bar
          dataKey="fail_coding_test"
          stackId="a"
          fill="var(--color-fail_coding_test)"
        />
        <Bar
          dataKey="coding_test"
          stackId="a"
          fill="var(--color-coding_test)"
        />
        <Bar
          dataKey="hired"
          stackId="a"
          fill="var(--color-hired)"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="interview_general_manager"
          stackId="a"
          fill="oklch(0.77 0.20 131)"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="interview_team_lead"
          stackId="a"
          fill="oklch(0.70 0.12 183)"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="offer"
          stackId="a"
          fill="oklch(0.59 0.20 277)"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="resume_scraped"
          stackId="a"
          fill="oklch(0.67 0.26 322)"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="screened"
          stackId="a"
          fill="oklch(0.65 0.22 16)"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="survey"
          stackId="a"
          fill="oklch(0.55 0.01 58)"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="unqualified"
          stackId="a"
          fill="oklch(0.47 0.14 37)"
          radius={[4, 4, 0, 0]}
        />
        <ChartLegend content={<ChartLegendContent className="flex flex-wrap" />} />
      </BarChart>

    </ChartContainer>
  </>
}