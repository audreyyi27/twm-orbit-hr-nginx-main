"use client"
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams";
import { PeriodEnum } from "@/core/utils/enums/dashboard";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { format, subDays } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { DateRange } from "react-day-picker";

export default function RangeFilter() {
  const searchParams = useSearchParams()
  const { updateMultipleSearchParams } = useUpdateSearchParams()

  const handleUpdateSearchParams = (value: string) => {
    updateMultipleSearchParams([
      { name: "range_filter", value: value },
      { name: "startDate", value: "" },
      { name: "endDate", value: "" }
    ])
  }

  return <div className="w-full flex justify-between flex-wrap">
    <div className="flex gap-2 flex-wrap">
      <Button
        onClick={() => handleUpdateSearchParams(PeriodEnum.weekly)}
        variant={[PeriodEnum.weekly, ""].includes(searchParams.get("range_filter") || "") ? "default" : "outline"}
      >weekly</Button>
      <Button
        onClick={() => handleUpdateSearchParams(PeriodEnum.monthly)}
        variant={searchParams.get("range_filter") == PeriodEnum.monthly ? "default" : "outline"}
      >Monthly</Button>
      <Button
        onClick={() => handleUpdateSearchParams(PeriodEnum.yearly)}
        variant={searchParams.get("range_filter") == PeriodEnum.yearly ? "default" : "outline"}
      >Yearly</Button>
      <Button
        onClick={() => handleUpdateSearchParams(PeriodEnum.all_time)}
        variant={searchParams.get("range_filter") == PeriodEnum.all_time ? "default" : "outline"}
      >All time</Button>
      <DateFilter />
      <div className="md:hidden">
        <StatusFilter />
      </div>
    </div>
    <div className="max-sm:hidden">
      <StatusFilter />
    </div>
  </div>
}

export function DateFilter() {
  const searchParams = useSearchParams()
  const { updateMultipleSearchParams } = useUpdateSearchParams()
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  const handleUpdateDateRange = (val: DateRange | undefined) => {
    let fromDate = val?.from
    let toDate = val?.to
    if (!val?.from && !val?.to) {
      fromDate = subDays(new Date(), 30)
      toDate = new Date()
    } else if (!val.from) {
      fromDate = val.to
    } else if (!val.to) {
      toDate = val.from
    }
    setDateRange(val)
    updateMultipleSearchParams([
      { name: "startDate", value: format(fromDate as Date, "y-MM-dd") },
      { name: "endDate", value: format(toDate as Date, "y-MM-dd") },
      { name: "range_filter", value: PeriodEnum.custom }
    ])
  }
  return <Popover>
    <PopoverTrigger asChild>
      <Button
        variant={searchParams.get("range_filter") == PeriodEnum.custom ? "default" : "outline"}
        className={cn(
          "w-fit pl-3 text-left font-normal ",

        )}
      >
        {dateRange?.from && dateRange.to ? (
          <span>{format(dateRange.from?.toString(), "PP")} - {format(dateRange.to?.toString(), "PP")}</span>
        ) : (
          <CalendarIcon className="ml-auto h-4 w-4" />
        )}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar
        mode="range"
        selected={dateRange}
        onSelect={(e) => handleUpdateDateRange(e)}
        disabled={(date) =>
          date > new Date() || date < new Date("1900-01-01")
        }
        captionLayout="dropdown"
      />
    </PopoverContent>
  </Popover>
}

export function StatusFilter() {
  const { setStatusFilter, statusFilterItems, statusFilter } = useDashboardStore()
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant={'outline'} className="capitalize">
        {statusFilter?.replaceAll("_", " ") || "Filter by"}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" >
      <DropdownMenuLabel>Recruitment status</DropdownMenuLabel>
      <DropdownMenuSeparator />
      {Object.values(statusFilterItems).map(item =>
        <DropdownMenuCheckboxItem
          key={item} className="capitalize"
          checked={statusFilter == item}
          onCheckedChange={() => setStatusFilter(item)}
        >
          {item.replaceAll("_", " ")}
        </DropdownMenuCheckboxItem>)}
      <DropdownMenuCheckboxItem
        className="capitalize"
        checked={statusFilter == "" || statusFilter == undefined}
        onCheckedChange={() => setStatusFilter("")}
      >
        All
      </DropdownMenuCheckboxItem>
    </DropdownMenuContent>
  </DropdownMenu>
}
